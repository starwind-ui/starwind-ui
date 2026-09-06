import { vuePackageSizeBaseline } from "./vue-package-size-baseline.mjs";

const aggregateGrowthPolicy = Object.freeze({
  maxGrowthBytes: 15 * 1024,
  maxGrowthPercent: 10,
});

export const aggregateBaselineProvenance = Object.freeze({
  date: "2026-08-15",
  publicCommit: "6d497055479ca56bad8463f3fc38bedc231d0174",
  release: Object.freeze({
    astro: "1.1.0",
    cli: "3.1.0",
    react: "1.1.0",
    runtime: "1.1.0",
  }),
});

const headlinePackageBudgets = [
  createAggregateBudget(
    {
      baselineGzipBytes: 139_964,
      label: "@starwind-ui/runtime",
    },
    "maxGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 36_486,
      label: "@starwind-ui/react (adapter only)",
    },
    "maxGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 179_332,
      label: "@starwind-ui/react + runtime",
    },
    "maxGzipBytes",
  ),
];

const matchedSupportBudgets = [
  createAggregateBudget(
    {
      baselineGzipBytes: 117_191,
      comparisonSet: "all-three-overlap",
      compareProviders: ["zag", "base"],
      label: "All-three overlap",
    },
    "maxStarwindGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 129_328,
      comparisonSet: "starwind-zag-overlap",
      compareProviders: ["zag"],
      label: "Starwind/Zag overlap",
    },
    "maxStarwindGzipBytes",
  ),
  createAggregateBudget(
    {
      baselineGzipBytes: 125_239,
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

export function evaluatePackageSizeBudgets({
  bundleResults,
  includePrivateVue = false,
  supportResults,
  vueBundleResults = [],
  vueColdImportResults = [],
  vueMatchedSupportResults = [],
  vuePackagePayload,
}) {
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

  const vueAbsoluteChecks = includePrivateVue
    ? createVueAbsoluteBudgetChecks({
        vueBundleResults,
        vueColdImportResults,
        vuePackagePayload,
      }).map((check) => {
        if (check.failure) failures.push(check.failure);
        if (check.advisory) advisories.push(check.advisory);
        return check;
      })
    : [];
  const vueMatchedSupportCheck = includePrivateVue
    ? evaluateVueMatchedSupportComparison(vueMatchedSupportResults)
    : null;
  if (vueMatchedSupportCheck?.advisory) advisories.push(vueMatchedSupportCheck.advisory);

  return {
    advisories: [...new Set(advisories)],
    fieldColdImportChecks,
    failures: [...new Set(failures)],
    headlineChecks,
    matchedSupportChecks,
    standaloneComponentChecks,
    vueAbsoluteChecks,
    vueMatchedSupportCheck,
  };
}

function createVueAbsoluteBudgetChecks({
  vueBundleResults,
  vueColdImportResults,
  vuePackagePayload,
}) {
  const measurements = new Map([
    [
      "vue.adapter-only",
      vueBundleResults.find((row) => row.label === "@starwind-ui/vue (adapter only)")?.gzipBytes,
    ],
    [
      "vue.combined",
      vueBundleResults.find((row) => row.label === "@starwind-ui/vue + runtime")?.gzipBytes,
    ],
    ["vue.packed-tarball", vuePackagePayload?.packageGzipBytes],
    ...vuePackageSizeBaseline.sentinels.map((component) => [
      `vue.cold.${component}`,
      vueColdImportResults.find((row) => row.component === component)?.gzipBytes,
    ]),
  ]);

  return Object.entries(vuePackageSizeBaseline.budgets).map(([id, budget]) =>
    evaluateVueSizeBudget({ id, measuredBytes: measurements.get(id), ...budget }),
  );
}

export function evaluateVueSizeBudget({
  ceilingBytes,
  headroomBytes,
  id,
  maximumBytes,
  measuredBytes,
}) {
  // Keep the frozen warning ceiling; round the new percentage allowance as the baseline did.
  const maxGzipBytes = maximumBytes + Math.max(Math.ceil(maximumBytes / 10), 2 * 1024);
  const validMeasurement = Number.isSafeInteger(measuredBytes) && measuredBytes >= 0;
  const growthBytes = validMeasurement ? measuredBytes - maximumBytes : null;
  const growthPercent = validMeasurement ? (growthBytes / maximumBytes) * 100 : null;
  let advisory = null;
  let failure = null;

  if (!validMeasurement) {
    const reason = measuredBytes == null ? "missing" : "invalid";
    failure = `${id} budget could not be evaluated: ${reason} min+gzip measurement.`;
  } else {
    const growth = `${formatBudgetBytes(growthBytes)} (${growthPercent.toFixed(2)}%) growth from baseline ${formatBudgetBytes(maximumBytes)}`;
    if (measuredBytes > maxGzipBytes) {
      failure = `${id} hard limit exceeded: ${formatBudgetBytes(measuredBytes)} with ${growth}; hard limit ${formatBudgetBytes(maxGzipBytes)} allows the greater of 10% or 2 KiB growth.`;
    } else if (measuredBytes > ceilingBytes) {
      advisory = `${id} review warning: ${formatBudgetBytes(measuredBytes)} with ${growth} exceeds warning limit ${formatBudgetBytes(ceilingBytes)}; hard limit ${formatBudgetBytes(maxGzipBytes)} allows the greater of 10% or 2 KiB growth.`;
    }
  }

  return {
    advisory,
    baselineGzipBytes: maximumBytes,
    failure,
    growthBytes,
    growthPercent,
    gzipBytes: measuredBytes ?? null,
    headroomBytes,
    id,
    label: id,
    maxGzipBytes,
    status: failure ? "Fail" : advisory ? "Warn" : "Pass",
    warningGzipBytes: ceilingBytes,
  };
}

function evaluateVueMatchedSupportComparison(results) {
  const starwindGzipBytes = results.find(({ provider }) => provider === "starwind-vue")?.gzipBytes;
  const comparatorGzipBytes = results.find(({ provider }) => provider === "zag-vue")?.gzipBytes;
  let advisory = null;
  let comparisonStatus = "Below comparator";

  if (starwindGzipBytes == null || comparatorGzipBytes == null) {
    comparisonStatus = "Unavailable";
    advisory =
      "Private Vue matched-support comparison could not be evaluated from the committed comparator snapshot.";
  } else if (starwindGzipBytes === comparatorGzipBytes) {
    comparisonStatus = "Equal comparator";
    advisory = `Private Vue matched-support comparison advisory: Starwind Vue ${formatBudgetBytes(starwindGzipBytes)} equals Zag Vue ${formatBudgetBytes(comparatorGzipBytes)}.`;
  } else if (starwindGzipBytes > comparatorGzipBytes) {
    comparisonStatus = "Above comparator";
    advisory = `Private Vue matched-support comparison advisory: Starwind Vue ${formatBudgetBytes(starwindGzipBytes)} is above Zag Vue ${formatBudgetBytes(comparatorGzipBytes)}.`;
  }

  return {
    advisory,
    comparatorGzipBytes: comparatorGzipBytes ?? null,
    comparisonStatus,
    failure: null,
    label: "Private Vue matched support vs Zag Vue",
    starwindGzipBytes: starwindGzipBytes ?? null,
    status: "Pass",
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
