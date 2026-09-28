import assert from "node:assert/strict";

/** Check rendered defaults at the demo boundary, where page CSS can override utilities. */
export async function verifyStockStyles(page) {
  const actual = await page.evaluate(() => {
    const style = (node) => {
      const css = getComputedStyle(node);
      return {
        marginTop: css.marginTop,
        marginBottom: css.marginBottom,
        paddingTop: css.paddingTop,
        paddingBottom: css.paddingBottom,
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        gap: css.gap,
      };
    };
    return {
      footerText: [
        ...document.querySelectorAll(
          '#card-review > [data-additional-examples] [data-slot="card-footer"] p',
        ),
      ].map(style),
      footers: [
        ...document.querySelectorAll(
          '#card-review > [data-additional-examples] [data-slot="card-footer"]',
        ),
      ].map(style),
      descriptions: [
        ...document.querySelectorAll(
          '#item-review > [data-additional-examples] [data-slot="item-description"]',
        ),
      ].map(style),
      items: [
        ...document.querySelectorAll(
          '#item-review > [data-additional-examples] [data-slot="item"]',
        ),
      ].map(style),
    };
  });
  assert.equal(actual.footerText.length, 2);
  assert.equal(actual.descriptions.length, 3);
  for (const text of [...actual.footerText, ...actual.descriptions]) {
    assert.equal(text.marginTop, "0px", "Review CSS adds top margin inside a stock component");
    assert.equal(
      text.marginBottom,
      "0px",
      "Review CSS adds bottom margin inside a stock component",
    );
  }
  assert.deepEqual(
    actual.footers.map((style) => style.paddingTop),
    ["20px", "16px"],
  );
  for (const description of actual.descriptions) {
    assert.equal(description.fontSize, "14px");
    assert.equal(description.lineHeight, "19.25px", "Item must retain its leading-snug utility");
  }
  assert.deepEqual(
    actual.items.map((style) => [style.paddingTop, style.paddingBottom, style.gap]),
    [
      ["16px", "16px", "16px"],
      ["12px", "12px", "10px"],
      ["12px", "12px", "10px"],
    ],
  );
}

export async function verifyInputStockStyles(page) {
  const actual = await page
    .locator('#input-review > [data-additional-examples] [data-slot="input"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          height: style.height,
          padding: style.paddingLeft,
          font: style.fontSize,
          border: style.borderTopWidth,
          opacity: style.opacity,
        };
      }),
    );
  assert.equal(actual.length, 6);
  assert.deepEqual(
    actual.slice(0, 3).map(({ height, padding, font }) => [height, padding, font]),
    [
      ["44px", "12px", "16px"],
      ["36px", "8px", "14px"],
      ["48px", "16px", "18px"],
    ],
  );
  assert.ok(actual.every(({ border }) => border === "1px"));
  assert.equal(actual[4].opacity, "0.5");
  return actual;
}

export async function verifyFormStockStyles(page) {
  const actual = await page
    .locator('#form-review > [data-additional-examples] [data-slot="form-error-summary"]')
    .evaluate((node) => {
      const summary = getComputedStyle(node),
        list = getComputedStyle(node.querySelector("[data-sw-form-error-summary-list]")),
        button = getComputedStyle(node.querySelector("[data-sw-form-error-summary-item]"));
      return {
        padding: summary.paddingTop,
        font: summary.fontSize,
        border: summary.borderTopWidth,
        listMargin: list.marginTop,
        listGap: list.gap,
        decoration: button.textDecorationLine,
        align: button.textAlign,
      };
    });
  assert.deepEqual(actual, {
    padding: "16px",
    font: "14px",
    border: "1px",
    listMargin: "8px",
    listGap: "4px",
    decoration: "underline",
    align: "left",
  });
  return actual;
}

export async function verifyInputGroupStockStyles(page) {
  const actual = await page
    .locator("#input-group-review > [data-additional-examples]")
    .evaluate((root) => {
      const style = (selector) => {
        const node = root.querySelector(selector),
          css = getComputedStyle(node);
        return {
          height: css.height,
          width: css.width,
          border: css.borderTopWidth,
          display: css.display,
          direction: css.flexDirection,
          opacity: css.opacity,
          paddingLeft: css.paddingLeft,
          paddingRight: css.paddingRight,
          paddingTop: css.paddingTop,
          paddingBottom: css.paddingBottom,
          background: css.backgroundColor,
          font: css.fontSize,
        };
      };
      return {
        root: style("#group-inline-start"),
        input: style("#group-search"),
        endInput: style("#group-cost"),
        addon: style('#group-inline-start [data-align="inline-start"]'),
        text: style('#group-inline-start [data-align="inline-start"] span'),
        button: style("#group-inline-start button"),
        icon: style("#group-block-end button"),
        blockStart: style("#group-block-start"),
        blockEnd: style("#group-block-end"),
        textarea: style("#group-note"),
        disabled: style("#group-disabled-root"),
      };
    });
  assert.equal(actual.root.height, "44px");
  assert.equal(actual.root.border, "1px");
  assert.equal(actual.root.display, "flex");
  assert.equal(actual.input.border, "0px");
  assert.equal(actual.input.paddingLeft, "6px");
  assert.equal(actual.endInput.paddingRight, "6px");
  assert.equal(actual.addon.paddingLeft, "10px");
  assert.equal(actual.text.font, "14px");
  assert.equal(actual.button.height, "32px");
  assert.equal(actual.button.background, "rgba(0, 0, 0, 0)");
  assert.equal(actual.icon.height, "32px");
  assert.equal(actual.icon.width, "32px");
  assert.equal(actual.blockStart.direction, "column");
  assert.equal(actual.blockEnd.direction, "column");
  assert.equal(actual.textarea.border, "0px");
  assert.equal(actual.textarea.paddingBottom, "12px");
  assert.equal(actual.disabled.opacity, "0.5");
  return actual;
}

export async function verifySwitchStockStyles(page) {
  const actual = await page
    .locator("#switch-review > [data-additional-examples]")
    .evaluate((root) => {
      return ["sm", "md", "lg"].map((size) => {
        const node = root.querySelector(`#review-switch-${size}`);
        const css = getComputedStyle(node);
        const thumb = getComputedStyle(node.querySelector('[data-slot="switch-toggle"]'));
        const label = getComputedStyle(root.querySelector(`label[for="review-switch-${size}"]`));
        return {
          tag: node.tagName,
          type: node.type,
          height: css.height,
          width: css.width,
          padding: css.getPropertyValue("--padding").trim(),
          thumb: thumb.width,
          font: label.fontSize,
        };
      });
    });
  assert.deepEqual(actual, [
    {
      tag: "BUTTON",
      type: "button",
      height: "21px",
      width: "39.5px",
      padding: "2.5px",
      thumb: "16px",
      font: "14px",
    },
    {
      tag: "BUTTON",
      type: "button",
      height: "26px",
      width: "49px",
      padding: "3px",
      thumb: "20px",
      font: "16px",
    },
    {
      tag: "BUTTON",
      type: "button",
      height: "32px",
      width: "60px",
      padding: "4px",
      thumb: "24px",
      font: "18px",
    },
  ]);
  return actual;
}

export async function verifyRadioGroupStockStyles(page) {
  const actual = await page
    .locator("#radio-group-review > [data-additional-examples]")
    .evaluate((root) => {
      const groups = [...root.querySelectorAll('[data-slot="radio-group"]')].map((node) => {
        const css = getComputedStyle(node);
        return [css.display, css.gap, node.getAttribute("data-size")];
      });
      const wrappers = [...root.querySelectorAll('[data-slot="radio-group-item-wrapper"]')].map(
        (node) => {
          const css = getComputedStyle(node);
          return [css.width, css.height];
        },
      );
      const controls = [...root.querySelectorAll('[data-slot="radio-group-item-control"]')].map(
        (node) => {
          const css = getComputedStyle(node);
          return [css.borderTopWidth, css.borderRadius];
        },
      );
      return {
        groups,
        wrappers,
        controls,
        defaultIcon: Boolean(root.querySelector('[data-slot="radio-group-item-indicator"] svg')),
        customIcon: Boolean(root.querySelector("[data-custom-radio-icon]")),
      };
    });
  assert.deepEqual(actual.groups, [
    ["grid", "12px", "md"],
    ["flex", "12px", "lg"],
  ]);
  assert.deepEqual(actual.wrappers, [
    ["20px", "20px"],
    ["20px", "20px"],
    ["20px", "20px"],
    ["24px", "24px"],
    ["24px", "24px"],
  ]);
  assert.ok(
    actual.controls.every(
      ([border, radius]) =>
        border === "1px" && (radius === "3.40282e+38px" || parseFloat(radius) > 1000),
    ),
  );
  assert.equal(actual.defaultIcon, true);
  assert.equal(actual.customIcon, true);
  return actual;
}

export async function verifyToggleStockStyles(page, group = false) {
  const actual = await page
    .locator(
      group
        ? "#toggle-group-review > [data-additional-examples]"
        : "#toggle-review > [data-additional-examples]",
    )
    .evaluate((root) => {
      const slot =
        root.closest("[data-styled-review]").dataset.styledReview === "toggle-group"
          ? "toggle-group-item"
          : "toggle";
      const items = [...root.querySelectorAll('[data-slot="' + slot + '"]')].map((node) => {
        const style = getComputedStyle(node);
        return {
          height: style.height,
          border: style.borderTopWidth,
          left: style.borderLeftWidth,
          opacity: style.opacity,
        };
      });
      const groups = [...root.querySelectorAll('[data-slot="toggle-group"]')].map((node) => {
        const style = getComputedStyle(node);
        return { direction: style.flexDirection, gap: style.gap };
      });
      return { items, groups };
    });
  assert.deepEqual(
    actual.items.map((item) => item.height),
    group
      ? ["44px", "44px", "44px", "36px", "36px", "36px", "48px", "48px"]
      : ["44px", "44px", "36px", "44px", "48px", "44px"],
  );
  if (group) {
    assert.deepEqual(actual.groups, [
      { direction: "row", gap: "8px" },
      { direction: "row", gap: "0px" },
      { direction: "column", gap: "8px" },
    ]);
    assert.deepEqual(
      actual.items.slice(3, 6).map((item) => [item.border, item.left]),
      [
        ["1px", "1px"],
        ["1px", "0px"],
        ["1px", "0px"],
      ],
    );
    assert.equal(actual.items[5].opacity, "0.5");
  } else {
    assert.ok(actual.items.slice(2, 5).every((item) => item.border === "1px"));
    assert.equal(actual.items[5].opacity, "0.5");
  }
  return actual;
}

export async function verifyFieldStockStyles(page) {
  const actual = await page
    .locator("#field-review > [data-additional-examples]")
    .evaluate((root) => {
      const style = (slot) => getComputedStyle(root.querySelector(`[data-slot="${slot}"]`));
      const field = style("field"),
        control = style("field-control"),
        description = style("field-description"),
        error = style("field-error"),
        separator = style("field-separator");
      return {
        direction: field.flexDirection,
        gap: field.gap,
        height: control.height,
        padding: control.paddingLeft,
        border: control.borderTopWidth,
        descriptionSize: description.fontSize,
        descriptionMargin: description.marginTop,
        errorSize: error.fontSize,
        separatorPosition: separator.position,
        separatorContent: root.querySelectorAll('[data-slot="field-separator-content"]').length,
      };
    });
  assert.deepEqual(actual, {
    direction: "column",
    gap: "8px",
    height: "44px",
    padding: "12px",
    border: "1px",
    descriptionSize: "14px",
    descriptionMargin: "0px",
    errorSize: "14px",
    separatorPosition: "relative",
    separatorContent: 1,
  });
  return actual;
}

export async function verifyInputOtpStockStyles(page) {
  const actual = await page
    .locator("#input-otp-review > [data-additional-examples]")
    .evaluate((review) => {
      const roots = [...review.querySelectorAll('[data-slot="input-otp"]')];
      const primary = roots[0];
      const caret = primary.querySelector("[data-sw-input-otp-caret]:not([hidden])");
      const caretStyle = caret && getComputedStyle(caret.firstElementChild);
      return {
        groups: roots.map((root) => ({
          gap: getComputedStyle(root).gap,
          opacity: getComputedStyle(root).opacity,
          slots: [...root.querySelectorAll('[data-slot="input-otp-slot"]')].map((slot) => {
            const css = getComputedStyle(slot);
            return { height: css.height, width: css.width, border: css.borderTopWidth };
          }),
        })),
        separator: getComputedStyle(primary.querySelector('[data-slot="input-otp-separator"] svg'))
          .width,
        caret: caretStyle && {
          width: caretStyle.width,
          height: caretStyle.height,
          animation: caretStyle.animationName,
        },
        activeRing: getComputedStyle(primary.querySelector('[data-active="true"]')).boxShadow,
      };
    });
  assert.deepEqual(actual.groups, [
    {
      gap: "8px",
      opacity: "1",
      slots: Array.from({ length: 6 }, () => ({ height: "36px", width: "36px", border: "1px" })),
    },
    {
      gap: "8px",
      opacity: "1",
      slots: Array.from({ length: 4 }, () => ({ height: "44px", width: "44px", border: "1px" })),
    },
    {
      gap: "8px",
      opacity: "0.5",
      slots: Array.from({ length: 4 }, () => ({ height: "48px", width: "48px", border: "1px" })),
    },
  ]);
  assert.equal(actual.separator, "24px");
  assert.deepEqual(actual.caret, { width: "1px", height: "16px", animation: "caret-blink" });
  assert.notEqual(actual.activeRing, "none");
  return actual;
}

export async function verifyDropzoneStockStyles(page) {
  const actual = await page
    .locator("#dropzone-review > [data-additional-examples]")
    .evaluate((review) => {
      const primary = review.querySelector("#document-upload");
      const rootStyle = getComputedStyle(primary);
      const files = primary.querySelector('[data-slot="dropzone-files-list"]');
      const uploading = review.querySelector("#uploading-example");
      const loader = uploading.querySelector('[data-slot="dropzone-loading-indicator"] svg');
      return {
        root: {
          display: rootStyle.display,
          direction: rootStyle.flexDirection,
          padding: rootStyle.padding,
          border: rootStyle.borderTopWidth,
          borderStyle: rootStyle.borderTopStyle,
          textAlign: rootStyle.textAlign,
        },
        icon: getComputedStyle(primary.querySelector('[data-slot="dropzone-upload-indicator"] svg'))
          .width,
        fileList: {
          visibility: getComputedStyle(files).visibility,
          text: getComputedStyle(files).fontSize,
          icon: getComputedStyle(files.querySelector("svg")).width,
        },
        loading: {
          width: getComputedStyle(loader).width,
          animation: getComputedStyle(loader).animationName,
          uploadHidden: uploading.querySelector('[data-slot="dropzone-upload-indicator"]').hidden,
          loadingHidden: uploading.querySelector('[data-slot="dropzone-loading-indicator"]').hidden,
        },
        disabled: {
          opacity: getComputedStyle(review.querySelector("#disabled-upload")).opacity,
          input: review.querySelector("#disabled-upload input").disabled,
        },
        inputCount: [...review.querySelectorAll('[data-slot="dropzone"]')].map(
          (root) => root.querySelectorAll('input[type="file"]').length,
        ),
      };
    });
  assert.deepEqual(actual.root, {
    display: "flex",
    direction: "column",
    padding: "48px 24px",
    border: "1px",
    borderStyle: "dashed",
    textAlign: "center",
  });
  assert.equal(actual.icon, "40px");
  assert.deepEqual(actual.fileList, { visibility: "visible", text: "14px", icon: "14px" });
  assert.deepEqual(actual.loading, {
    width: "40px",
    animation: "spin",
    uploadHidden: true,
    loadingHidden: false,
  });
  assert.deepEqual(actual.disabled, { opacity: "0.5", input: true });
  assert.deepEqual(actual.inputCount, [1, 1, 1]);
  return actual;
}

export async function verifyAccordionStockStyles(page) {
  const styles = await page
    .locator("#accordion-review > [data-additional-examples]")
    .evaluate((root) => {
      const trigger = root.querySelector('#single-accordion [data-slot="accordion-trigger"]');
      const panel = root.querySelector('#single-accordion [data-slot="accordion-content"]');
      const css = getComputedStyle(trigger),
        content = getComputedStyle(panel),
        inner = getComputedStyle(panel.firstElementChild);
      return {
        padding: [css.paddingTop, css.paddingBottom],
        gap: css.gap,
        fontWeight: css.fontWeight,
        icon: [
          getComputedStyle(trigger.querySelector("svg")).width,
          getComputedStyle(trigger.querySelector("svg")).height,
          getComputedStyle(trigger.querySelector("svg")).rotate,
        ],
        content: [content.overflow, content.animationName, inner.paddingTop, inner.paddingBottom],
        borders: [...root.querySelectorAll('#single-accordion [data-slot="accordion-item"]')].map(
          (node) => getComputedStyle(node).borderBottomWidth,
        ),
        disabled: getComputedStyle(root.querySelector("button:disabled")).opacity,
        allButtons: [...root.querySelectorAll('[data-slot="accordion-trigger"]')].every(
          (node) => node.tagName === "BUTTON",
        ),
      };
    });
  assert.deepEqual(styles.padding, ["16px", "16px"]);
  assert.equal(styles.gap, "16px");
  assert.equal(styles.fontWeight, "500");
  assert.deepEqual(styles.icon, ["20px", "20px", "180deg"]);
  assert.deepEqual(styles.content, ["hidden", "accordion-down", "0px", "16px"]);
  assert.deepEqual(styles.borders, ["1px", "1px", "0px"]);
  assert.equal(styles.disabled, "0.5");
  assert.equal(styles.allButtons, true);
}

export async function verifySliderStockStyles(page) {
  const result = await page
    .locator("#slider-review > [data-additional-examples]")
    .evaluate((root) => {
      const css = (node) => getComputedStyle(node),
        primary = root.querySelector("#price-slider"),
        vertical = root.querySelector("#vertical-slider");
      return {
        thumbs: [...root.querySelectorAll('[data-slot="slider-thumb"]')].map((node) => ({
          width: css(node).width,
          height: css(node).height,
          radius: css(node).borderRadius,
          border: css(node).borderTopWidth,
        })),
        horizontal: [
          ...root.querySelectorAll('[data-slot="slider-track"][data-orientation="horizontal"]'),
        ].map((node) => css(node).height),
        vertical: [
          css(vertical.querySelector('[data-slot="slider-track"]')).width,
          css(vertical.querySelector('[data-slot="slider-track"]')).height,
        ],
        range: [
          primary.querySelector('[data-slot="slider-range"]').style.left,
          primary.querySelector('[data-slot="slider-range"]').style.width,
        ],
        primaryThumbs: [...primary.querySelectorAll('[data-slot="slider-thumb"]')].map(
          (node) => node.style.left,
        ),
        verticalThumb: vertical.querySelector('[data-slot="slider-thumb"]').style.bottom,
        colors: ["volume-slider", "price-slider", "vertical-slider"].map(
          (id) => css(root.querySelector("#" + id + ' [data-slot="slider-range"]')).backgroundColor,
        ),
        disabled: css(root.querySelector("#disabled-slider")).opacity,
        inputs: [...root.querySelectorAll("[data-sw-slider-input]")].every(
          (node) =>
            node.type === "range" &&
            node.getAttribute("aria-hidden") === "true" &&
            node.tabIndex === -1,
        ),
      };
    });
  for (const thumb of result.thumbs) {
    assert.deepEqual(
      { width: thumb.width, height: thumb.height, border: thumb.border },
      { width: "16px", height: "16px", border: "1px" },
    );
    assert.ok(parseFloat(thumb.radius) >= 8, "round thumb");
  }
  assert.deepEqual(result.horizontal, ["6px", "6px", "6px"]);
  assert.deepEqual(result.vertical, ["6px", "176px"]);
  assert.deepEqual(result.range, ["25%", "50%"]);
  assert.deepEqual(result.primaryThumbs, ["25%", "75%"]);
  assert.equal(result.verticalThumb, "40%");
  assert.equal(new Set(result.colors).size, 3);
  for (const color of result.colors) assert.notEqual(color, "rgba(0, 0, 0, 0)");
  assert.equal(result.disabled, "0.5");
  assert.equal(result.inputs, true);
}
