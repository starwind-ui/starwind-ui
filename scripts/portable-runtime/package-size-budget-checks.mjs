const headlinePackageBudgets = [
  {
    label: "@starwind-ui/runtime",
    // 8a046cdaa pre-feature: 113,040 B; post-feature rebaseline: 126,295 B (+13,255 B).
    // Preserve the former 1,648 B of absolute headroom exactly.
    maxGzipBytes: 127_943,
  },
  {
    label: "@starwind-ui/react (adapter only)",
    // 8a046cdaa pre-feature: 31,118 B; post-feature rebaseline: 35,194 B (+4,076 B).
    // Preserve the former 626 B of absolute headroom exactly.
    maxGzipBytes: 35_820,
  },
  {
    label: "@starwind-ui/react + runtime",
    // 8a046cdaa pre-feature: 145,790 B; post-feature rebaseline: 164,250 B (+18,460 B).
    // Preserve the former 2,690 B of absolute headroom exactly.
    maxGzipBytes: 166_940,
  },
];

const matchedSupportBudgets = [
  {
    comparisonSet: "all-three-overlap",
    compareProviders: ["zag", "base"],
    label: "All-three overlap",
    maxStarwindGzipBytes: 105 * 1024,
  },
  {
    comparisonSet: "starwind-zag-overlap",
    compareProviders: ["zag"],
    label: "Starwind/Zag overlap",
    // 8a046cdaa pre-feature: 116,526 B; post-feature rebaseline: 118,786 B
    // (+2,260 B), or 1,026 B
    // over the old ceiling. Membership remains 28 with Color Picker at 0 B. The
    // exact +8,302 minified Runtime delta is documented in the checked report.
    maxStarwindGzipBytes: 120_020,
  },
  {
    comparisonSet: "starwind-base-overlap",
    compareProviders: ["base"],
    label: "Starwind/Base UI overlap",
    maxStarwindGzipBytes: 115 * 1024,
  },
];

const fieldColdImportBudgets = [
  {
    component: "field",
    label: "Field cold import",
    maxGzipBytes: 22 * 1024,
    provider: "starwind",
  },
];

export function getPackageSizeBudgetCeilings() {
  return Object.freeze({
    headline: Object.freeze(
      Object.fromEntries(
        headlinePackageBudgets.map((budget) => [budget.label, budget.maxGzipBytes]),
      ),
    ),
    matchedSupport: Object.freeze(
      Object.fromEntries(
        matchedSupportBudgets.map((budget) => [budget.comparisonSet, budget.maxStarwindGzipBytes]),
      ),
    ),
  });
}

export function evaluatePackageSizeBudgets({ bundleResults, supportResults }) {
  const advisories = [];
  const failures = [];

  const headlineChecks = headlinePackageBudgets.map((budget) => {
    const result = bundleResults.find((row) => row.label === budget.label);
    const gzipBytes = result?.gzipBytes ?? null;
    let failure = null;

    if (gzipBytes == null) {
      failure = `${budget.label} headline package budget could not be evaluated: missing min+gzip measurement.`;
    } else if (gzipBytes > budget.maxGzipBytes) {
      failure = `${budget.label} exceeded headline package budget: ${formatBudgetBytes(
        gzipBytes,
      )} > ${formatBudgetBytes(budget.maxGzipBytes)}.`;
    }

    if (failure) {
      failures.push(failure);
    }

    return {
      ...budget,
      failure,
      gzipBytes,
      status: failure ? "Fail" : "Pass",
    };
  });

  const fieldColdImportChecks = fieldColdImportBudgets.map((budget) => {
    const result = findSupportComponentResult(supportResults, budget.component, budget.provider);
    const gzipBytes = result?.gzipBytes ?? null;
    let failure = null;

    if (gzipBytes == null) {
      failure = `${budget.label} budget could not be evaluated: missing Field cold import min+gzip measurement.`;
    } else if (gzipBytes > budget.maxGzipBytes) {
      failure = `${budget.label} budget exceeded: Field cold import ${formatBudgetBytes(
        gzipBytes,
      )} > budget ${formatBudgetBytes(budget.maxGzipBytes)}.`;
    }

    if (failure) {
      failures.push(failure);
    }

    return {
      ...budget,
      failure,
      gzipBytes,
      status: failure ? "Fail" : "Pass",
    };
  });

  const matchedSupportChecks = matchedSupportBudgets.flatMap((budget) => {
    const starwind = findSupportResult(supportResults, budget.comparisonSet, "starwind");
    const starwindGzipBytes = starwind?.gzipBytes ?? null;
    const absoluteFailure = getAbsoluteMatchedSupportFailure(budget, starwindGzipBytes);

    if (absoluteFailure) {
      failures.push(absoluteFailure);
    }

    return budget.compareProviders.map((provider) => {
      const comparator = findSupportResult(supportResults, budget.comparisonSet, provider);
      const comparatorGzipBytes = comparator?.gzipBytes ?? null;
      const comparison = getMatchedSupportComparison({
        budget,
        comparatorGzipBytes,
        provider,
        starwindGzipBytes,
      });

      if (comparison.advisory) {
        advisories.push(comparison.advisory);
      }

      return {
        ...budget,
        advisory: comparison.advisory,
        comparatorGzipBytes,
        comparatorLabel: formatProvider(provider),
        comparisonStatus: comparison.status,
        failure: absoluteFailure,
        label: `${budget.label} vs ${formatProvider(provider)}`,
        starwindGzipBytes,
        status: absoluteFailure ? "Fail" : "Pass",
      };
    });
  });

  return {
    advisories: [...new Set(advisories)],
    fieldColdImportChecks,
    failures: [...new Set(failures)],
    headlineChecks,
    matchedSupportChecks,
  };
}

function getAbsoluteMatchedSupportFailure(budget, starwindGzipBytes) {
  if (starwindGzipBytes == null) {
    return `${budget.label} set-wide Starwind matched-support budget could not be evaluated: missing Starwind min+gzip measurement.`;
  }

  if (starwindGzipBytes <= budget.maxStarwindGzipBytes) {
    return null;
  }

  const affectedRows = budget.compareProviders
    .map((provider) => `${budget.label} vs ${formatProvider(provider)}`)
    .join(", ");

  return `${budget.label} set-wide Starwind matched-support budget exceeded: Starwind ${formatBudgetBytes(
    starwindGzipBytes,
  )} > budget ${formatBudgetBytes(budget.maxStarwindGzipBytes)}. Affected budget rows: ${affectedRows}.`;
}

function getMatchedSupportComparison({ budget, comparatorGzipBytes, provider, starwindGzipBytes }) {
  if (starwindGzipBytes == null) {
    return {
      advisory: `${budget.label} comparison against ${formatProvider(
        provider,
      )} could not be evaluated: missing Starwind min+gzip measurement.`,
      status: "Unavailable",
    };
  }

  if (comparatorGzipBytes == null) {
    return {
      advisory: `${budget.label} comparison against ${formatProvider(
        provider,
      )} could not be evaluated: missing ${formatProvider(provider)} min+gzip measurement.`,
      status: "Unavailable",
    };
  }

  if (starwindGzipBytes < comparatorGzipBytes) {
    return { advisory: null, status: "Below comparator" };
  }

  return {
    advisory: `${budget.label} comparison against ${formatProvider(
      provider,
    )} advisory: Starwind ${formatBudgetBytes(starwindGzipBytes)} is not below ${formatProvider(
      provider,
    )} ${formatBudgetBytes(comparatorGzipBytes)}.`,
    status: "Above comparator",
  };
}

function findSupportResult(results, comparisonSet, provider) {
  return results.find((row) => row.comparisonSet === comparisonSet && row.provider === provider);
}

function findSupportComponentResult(results, component, provider) {
  return results.find((row) => row.component === component && row.provider === provider);
}

function formatProvider(provider) {
  return provider === "zag" ? "Zag React" : "Base UI";
}

function formatBudgetBytes(bytes) {
  if (bytes == null) return "missing";
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes).toLocaleString("en-US")} B (${(bytes / 1024).toFixed(1)} KiB)`;
}
