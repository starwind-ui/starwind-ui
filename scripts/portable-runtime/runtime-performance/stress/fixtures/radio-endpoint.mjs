export function radioEndpointReady(state) {
  return (
    state.targetSelected === true &&
    state.primarySelected === false &&
    state.selectedCount === 1 &&
    state.checkedInputCount === 1 &&
    state.submittedValue === "item-1000"
  );
}
