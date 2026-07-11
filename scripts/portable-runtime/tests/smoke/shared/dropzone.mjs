export async function verifyDropzoneCases({ page, ids, label }) {
  await page.locator(`#${ids.demo}`).scrollIntoViewIfNeeded();

  const initialState = await page.evaluate(readDropzoneState, ids);

  await page.locator(`#${ids.multiple} input[type="file"]`).setInputFiles([
    {
      buffer: Buffer.from("first dropzone file"),
      mimeType: "text/plain",
      name: "dropzone-alpha.txt",
    },
    {
      buffer: Buffer.from("second dropzone file"),
      mimeType: "text/plain",
      name: "dropzone-beta.txt",
    },
  ]);
  await page.waitForFunction(
    ({ multiple }) => document.getElementById(multiple)?.getAttribute("data-has-files") === "true",
    ids,
  );
  if (ids.reactFilesText) {
    await page.waitForFunction(
      ({ reactFilesText }) =>
        document.querySelector(reactFilesText)?.textContent?.replace(/\s+/g, " ").trim() ===
        "Selected files: dropzone-alpha.txt, dropzone-beta.txt",
      ids,
    );
  }
  const afterInputFiles = await page.evaluate(readDropzoneState, ids);

  await page.evaluate(({ defaultRoot }) => {
    const root = document.getElementById(defaultRoot);
    const transfer = new DataTransfer();
    transfer.items.add(new File(["dropped"], "dropped-report.pdf", { type: "application/pdf" }));

    root?.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
  }, ids);
  await page.waitForFunction(
    ({ defaultRoot }) =>
      document.getElementById(defaultRoot)?.getAttribute("data-drag-active") === "true",
    ids,
  );
  const duringDrag = await page.evaluate(readDropzoneState, ids);

  await page.evaluate(({ defaultRoot }) => {
    const root = document.getElementById(defaultRoot);
    const transfer = new DataTransfer();
    transfer.items.add(new File(["dropped"], "dropped-report.pdf", { type: "application/pdf" }));

    root?.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
  }, ids);
  await page.waitForFunction(
    ({ defaultRoot }) =>
      document.getElementById(defaultRoot)?.getAttribute("data-has-files") === "true",
    ids,
  );
  const afterDrop = await page.evaluate(readDropzoneState, ids);

  await page.evaluate(({ disabled }) => {
    const root = document.getElementById(disabled);
    const transfer = new DataTransfer();
    transfer.items.add(new File(["ignored"], "ignored.txt", { type: "text/plain" }));

    root?.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
  }, ids);
  await page.waitForTimeout(50);
  const afterDisabledDrag = await page.evaluate(readDropzoneState, ids);

  await page.evaluate(({ disabled }) => {
    const root = document.getElementById(disabled);
    const transfer = new DataTransfer();
    transfer.items.add(new File(["ignored"], "ignored.txt", { type: "text/plain" }));

    root?.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
  }, ids);
  await page.waitForTimeout(50);
  const afterDisabledDrop = await page.evaluate(readDropzoneState, ids);

  if (
    initialState.rootCount !== 4 ||
    initialState.defaultRoot.role !== "button" ||
    initialState.defaultRoot.tabIndex !== 0 ||
    initialState.defaultRoot.hasDataSwDropzone !== true ||
    initialState.defaultRoot.className?.includes("starwind-dropzone") === true ||
    initialState.defaultRoot.className?.includes("relative") !== true ||
    initialState.defaultRoot.className?.includes("flex") !== true ||
    initialState.defaultRoot.className?.includes("w-full") !== true ||
    initialState.defaultRoot.dragActive !== "false" ||
    initialState.defaultRoot.hasFiles !== "false" ||
    initialState.defaultRoot.inputType !== "file" ||
    initialState.defaultRoot.inputName !== ids.defaultName ||
    initialState.defaultRoot.inputTabIndex !== -1 ||
    initialState.defaultRoot.inputAriaHidden !== "true" ||
    initialState.defaultRoot.inputHasDataSw !== true ||
    initialState.defaultRoot.inputPosition !== "absolute" ||
    initialState.defaultRoot.inputWidth !== "1px" ||
    initialState.defaultRoot.inputHeight !== "1px" ||
    initialState.defaultRoot.filesListInvisible !== true ||
    initialState.uploadingRoot.isUploading !== "true" ||
    initialState.uploadingRoot.uploadIndicatorHidden !== true ||
    initialState.uploadingRoot.loadingIndicatorHidden !== false ||
    initialState.disabledRoot.ariaDisabled !== "true" ||
    initialState.disabledRoot.hasDataDisabled !== true ||
    initialState.disabledRoot.inputDisabled !== true ||
    initialState.disabledRoot.tabIndex !== -1 ||
    afterInputFiles.multipleRoot.hasFiles !== "true" ||
    afterInputFiles.multipleRoot.inputFileNames.join(",") !==
      "dropzone-alpha.txt,dropzone-beta.txt" ||
    afterInputFiles.multipleRoot.formFileNames.join(",") !==
      "dropzone-alpha.txt,dropzone-beta.txt" ||
    afterInputFiles.multipleRoot.filesListInvisible !== false ||
    afterInputFiles.multipleRoot.filesListText.includes("dropzone-alpha.txt") !== true ||
    afterInputFiles.multipleRoot.filesListText.includes("dropzone-beta.txt") !== true ||
    (ids.reactFilesText &&
      afterInputFiles.reactFilesText !== "Selected files: dropzone-alpha.txt, dropzone-beta.txt") ||
    duringDrag.defaultRoot.dragActive !== "true" ||
    afterDrop.defaultRoot.dragActive !== "false" ||
    afterDrop.defaultRoot.hasFiles !== "true" ||
    afterDrop.defaultRoot.inputFileNames.join(",") !== "dropped-report.pdf" ||
    afterDrop.defaultRoot.formFileNames.join(",") !== "dropped-report.pdf" ||
    afterDrop.defaultRoot.filesListText.includes("dropped-report.pdf") !== true ||
    afterDisabledDrag.disabledRoot.dragActive !== "false" ||
    afterDisabledDrag.disabledRoot.hasFiles !== "false" ||
    afterDisabledDrag.disabledRoot.formFileNames.length !== 0 ||
    afterDisabledDrop.disabledRoot.hasFiles !== "false" ||
    afterDisabledDrop.disabledRoot.inputFileNames.length !== 0
  ) {
    throw new Error(
      `Expected ${label} Dropzone demo to expose runtime state, file input sync, drag/drop, uploading, disabled, file list, and form compatibility, got ${JSON.stringify(
        {
          afterDisabledDrop,
          afterDisabledDrag,
          afterDrop,
          afterInputFiles,
          duringDrag,
          initialState,
        },
      )}.`,
    );
  }
}

function readDropzoneState(ids) {
  const readRoot = (id) => {
    const root = document.getElementById(id);
    const input = root?.querySelector("input[type='file']");
    const filesList = root?.querySelector("[data-sw-dropzone-files-list]");
    const uploadIndicator = root?.querySelector("[data-sw-dropzone-upload-indicator]");
    const loadingIndicator = root?.querySelector("[data-sw-dropzone-loading-indicator]");
    const formData =
      input instanceof HTMLInputElement && input.form
        ? new FormData(input.form).getAll(input.name)
        : [];

    return {
      ariaDisabled: root?.getAttribute("aria-disabled") ?? null,
      className: root?.getAttribute("class") ?? null,
      dragActive: root?.getAttribute("data-drag-active") ?? null,
      filesListInvisible:
        filesList instanceof HTMLElement ? filesList.classList.contains("invisible") : null,
      filesListText: filesList?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      formFileNames: formData.map((file) => (file instanceof File ? file.name : String(file))),
      hasDataDisabled: root instanceof HTMLElement ? root.hasAttribute("data-disabled") : null,
      hasDataSwDropzone: root instanceof HTMLElement ? root.hasAttribute("data-sw-dropzone") : null,
      hasFiles: root?.getAttribute("data-has-files") ?? null,
      inputDisabled: input instanceof HTMLInputElement ? input.disabled : null,
      inputFileNames:
        input instanceof HTMLInputElement
          ? Array.from(input.files ?? []).map((file) => file.name)
          : [],
      inputAriaHidden: input?.getAttribute("aria-hidden") ?? null,
      inputHasDataSw:
        input instanceof HTMLElement ? input.hasAttribute("data-sw-dropzone-input") : null,
      inputHeight: input instanceof HTMLElement ? getComputedStyle(input).height : null,
      inputName: input instanceof HTMLInputElement ? input.name : null,
      inputPosition: input instanceof HTMLElement ? getComputedStyle(input).position : null,
      inputTabIndex: input instanceof HTMLInputElement ? input.tabIndex : null,
      inputType: input instanceof HTMLInputElement ? input.type : null,
      inputWidth: input instanceof HTMLElement ? getComputedStyle(input).width : null,
      isUploading: root?.getAttribute("data-is-uploading") ?? null,
      loadingIndicatorHidden:
        loadingIndicator instanceof HTMLElement ? loadingIndicator.hidden : null,
      role: root?.getAttribute("role") ?? null,
      tabIndex: root instanceof HTMLElement ? root.tabIndex : null,
      uploadIndicatorHidden: uploadIndicator instanceof HTMLElement ? uploadIndicator.hidden : null,
    };
  };

  return {
    defaultRoot: readRoot(ids.defaultRoot),
    disabledRoot: readRoot(ids.disabled),
    multipleRoot: readRoot(ids.multiple),
    reactFilesText: ids.reactFilesText
      ? (document.querySelector(ids.reactFilesText)?.textContent?.replace(/\s+/g, " ").trim() ??
        null)
      : null,
    rootCount: document.querySelectorAll(`#${ids.demo} [data-slot='dropzone'][data-sw-dropzone]`)
      .length,
    uploadingRoot: readRoot(ids.uploading),
  };
}
