const aggregateGrowthPolicy = Object.freeze({
  maxGrowthBytes: 15 * 1024,
  maxGrowthPercent: 10,
});

const headlinePackageBudgets = [
  createAggregateBudget(
    {
      baselineGzipBytes: 126_295,
      label: "@starwind-ui/runtime",
    },
    "maxGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 35_194,
      label: "@starwind-ui/react (adapter only)",
    },
    "maxGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 164_250,
      label: "@starwind-ui/react + runtime",
    },
    "maxGzipBytes",
  ),
];

const matchedSupportBudgets = [
  createAggregateBudget(
    {
      baselineGzipBytes: 107_231,
      comparisonSet: "all-three-overlap",
      compareProviders: ["zag", "base"],
      label: "All-three overlap",
    },
    "maxStarwindGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 118_786,
      comparisonSet: "starwind-zag-overlap",
      compareProviders: ["zag"],
      label: "Starwind/Zag overlap",
    },
    "maxStarwindGzipBytes",
  ),
  createAggregateBudget(
    {
      // This set predated exact raw-gzip diagnostics. Its former committed ceiling
      // is the retained baseline until the next explicit size-report refresh.
      baselineGzipBytes: 115 * 1024,
      comparisonSet: "starwind-base-overlap",
      compareProviders: ["base"],
      label: "Starwind/Base UI overlap",
    },
    "maxStarwindGzipBytes",
  ),
];

const fieldColdImportBudgets = [
  {
    component: "field",
    label: "Field cold import",
    maxGzipBytes: 22 * 1024,
    provider: "starwind",
  },
];

const standaloneComponentBudgets = [
  {
    label: "Color Picker cold import",
    maxGzipBytes: 24 * 1024,
    packageLabel: "@starwind-ui/runtime/color-picker",
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
      failure = formatAggregateFailure({
        baselineGzipBytes: budget.baselineGzipBytes,
        label: budget.label,
        maxGzipBytes: budget.maxGzipBytes,
        measuredGzipBytes: gzipBytes,
      });
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

  const standaloneComponentChecks = standaloneComponentBudgets.map((budget) => {
    const result = bundleResults.find((row) => row.label === budget.packageLabel);
    const gzipBytes = result?.gzipBytes ?? null;
    let failure = null;

    if (gzipBytes == null) {
      failure = `${budget.label} budget could not be evaluated: missing ${budget.packageLabel} min+gzip measurement.`;
    } else if (gzipBytes > budget.maxGzipBytes) {
      failure = `${budget.label} budget exceeded: ${formatBudgetBytes(
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
    standaloneComponentChecks,
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

  return `${budget.label} set-wide Starwind matched-support regression guard exceeded: Starwind ${formatBudgetBytes(
    starwindGzipBytes,
  )} > guard ${formatBudgetBytes(budget.maxStarwindGzipBytes)} from baseline ${formatBudgetBytes(
    budget.baselineGzipBytes,
  )}. The guard allows up to ${formatAggregateGrowthPolicy()}. Affected rows: ${affectedRows}.`;
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

function createAggregateBudget(input, ceilingProperty) {
  const percentCeiling = Math.floor(
    input.baselineGzipBytes * (1 + aggregateGrowthPolicy.maxGrowthPercent / 100),
  );
  const absoluteCeiling = input.baselineGzipBytes + aggregateGrowthPolicy.maxGrowthBytes;
  const maxGzipBytes = Math.min(percentCeiling, absoluteCeiling);

  return {
    ...input,
    [ceilingProperty]: maxGzipBytes,
    maxGrowthBytes: aggregateGrowthPolicy.maxGrowthBytes,
    maxGrowthPercent: aggregateGrowthPolicy.maxGrowthPercent,
  };
}

function formatAggregateFailure({ baselineGzipBytes, label, maxGzipBytes, measuredGzipBytes }) {
  return `${label} exceeded aggregate regression guard: ${formatBudgetBytes(
    measuredGzipBytes,
  )} > guard ${formatBudgetBytes(maxGzipBytes)} from baseline ${formatBudgetBytes(
    baselineGzipBytes,
  )}. The guard allows up to ${formatAggregateGrowthPolicy()}.`;
}

function formatAggregateGrowthPolicy() {
  return `${aggregateGrowthPolicy.maxGrowthPercent}% or ${formatBudgetBytes(
    aggregateGrowthPolicy.maxGrowthBytes,
  )} growth, whichever comes first`;
}
