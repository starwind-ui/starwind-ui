import type { DistConsumer } from "./dist-consumer.js";
import {
  menuLifecycleCases,
  menuLifecycleActions,
  menuModelActions,
  verifyMenuBrowser,
} from "./menu-browser.js";

export async function verifyContextMenuLifecycle(consumer: DistConsumer, styled = false) {
  const configs = [
    ...menuLifecycleCases.filter(({ id }) => id !== "hover"),
    ...[
      "context-a",
      "context-b",
      "anchor-popup",
      "anchor-options",
      "anchor-structure",
      "anchor-placement",
      "anchor-content",
      "touch",
      "touch-replace",
      "touch-unmount",
    ].map((id) => ({
      id,
      open: false,
    })),
    { id: "context-modal", open: false, modal: true },
  ];
  const { build, ...result } = await verifyMenuBrowser(
    consumer,
    configs,
    menuModelActions + menuLifecycleActions(styled, true, contextActions),
    styled,
    true,
  );
  return { result, build };
}

const contextActions = `
const anchors = () => [...document.querySelectorAll("[data-sw-context-menu-anchor]")];
const touch = (element,type,x=270,y=160,count=1) => {
 const touches = Array.from({length:count},(_,index)=>new Touch({identifier:index,target:element,clientX:x+index,clientY:y+index}));
 element.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:type === "touchend" || type === "touchcancel" ? [] : touches,changedTouches:touches}));
};
const a="context-a",b="context-b";
assert(button(a).tagName === "DIV" && button(a).tabIndex === 0 && button(a).getAttribute("aria-haspopup") === "menu" && button(a).getAttribute("style")?.includes("-webkit-touch-callout: none"),"Context Trigger retains its native div, keyboard entry, and touch-callout policy");
button(a).click(); key(button(a),"ArrowDown"); await finish(); assert(!state(a).visible,"ordinary click and ArrowDown retain Context activation policy");
assert(contextPoint(button(a),220,150) === false,"enabled right-click consumes its native menu event"); await finish();
const firstAnchor=contextAnchor(220,150),firstPopup=popup(a).getBoundingClientRect();
assert(firstAnchor?.isConnected && state(a).visible && Math.abs(firstPopup.left-220)<2 && Math.abs(firstPopup.top-154)<2,"right-click anchors the popup to Runtime coordinates");
contextPoint(button(a),350,230); await finish();
const movedPopup=popup(a).getBoundingClientRect();
assert(contextAnchor(350,230)===firstAnchor && state(a).visible && Math.abs(movedPopup.left-350)<2 && Math.abs(movedPopup.top-234)<2,"an open Context Menu reuses its anchor at the new pointer position");
contextPoint(button(b),510,190); await finish();
const secondAnchor=contextAnchor(510,190);
assert(secondAnchor?.isConnected && secondAnchor!==firstAnchor && contextAnchor(350,230)===firstAnchor && state(b).visible,"multiple roots keep separate coordinate anchors");
cases[a].setModel("open",false);cases[b].setModel("open",false);await finish();
const recreationMeasurements=[];
for (const change of [{id:"anchor-popup",part:"popup",x:280,y:170},{id:"anchor-options",part:"closeDelay",x:460,y:250}]) {
 contextPoint(button(change.id),change.x,change.y);await finish();
 const beforePopup=popup(change.id).getBoundingClientRect(),beforeAnchors=anchors(),oldAnchor=contextAnchor(change.x,change.y);
 const before={open:state(change.id).open,visible:state(change.id).visible,left:beforePopup.left,top:beforePopup.top,anchor:oldAnchor?.getAttribute("style")};
 if(change.part === "popup") cases[change.id].replace("popup");else cases[change.id].setDelay(340);
 await finish();
 const afterPopup=popup(change.id).getBoundingClientRect(),newAnchor=anchors().find(anchor=>!beforeAnchors.includes(anchor));
 const after={open:state(change.id).open,visible:state(change.id).visible,left:afterPopup.left,top:afterPopup.top,anchor:newAnchor?.getAttribute("style"),oldAnchorConnected:oldAnchor?.isConnected};
 recreationMeasurements.push({change:change.part,before,after,retained:!after.oldAnchorConnected && !!newAnchor && after.open===true && after.visible && Math.abs(after.left-before.left)<2 && Math.abs(after.top-before.top)<2});
 cases[change.id].setModel("open",false);await finish();
}
assert(recreationMeasurements.every(measurement=>measurement.retained),"open Context Menu recreation retains the current coordinate without another activation: "+JSON.stringify(recreationMeasurements));
const anchorRectangle=anchor=>[anchor.style.left,anchor.style.top,anchor.style.width,anchor.style.height].join("|");
const structure="anchor-structure";
contextPoint(button(structure),380,200);await finish();
let structureAnchor=contextAnchor(380,200);
const structureRectangle=anchorRectangle(structureAnchor),structureCount=anchors().length;
for(const change of ["remove-submenu","add-submenu","replace-trigger"]) {
 const retired=structureAnchor,beforeAnchors=anchors();
 if(change === "replace-trigger") cases[structure].replace("trigger");else cases[structure].setSub(change === "add-submenu");
 await finish();structureAnchor=anchors().find(anchor=>!beforeAnchors.includes(anchor));
 assert(!retired.isConnected && structureAnchor && anchors().length===structureCount && anchorRectangle(structureAnchor)===structureRectangle && state(structure).open && state(structure).visible,change+" recreates one anchor at the same invocation point without another activation");
 assert(Boolean(query("data-subroot",structure))===(change!=="remove-submenu"),change+" updates actual submenu anatomy");
}
key(query("data-subtrigger",structure),"ArrowRight");await finish();assert(!popup(structure+"-sub").hidden,"recreated submenu keeps working at the retained invocation point");cases[structure].setModel("open",false);await finish();
const placement="anchor-placement";
contextPoint(button(placement),480,220);await finish();
let placementAnchor=contextAnchor(480,220);
const placementRectangle=anchorRectangle(placementAnchor);
for(const change of ["side","align","offset"]) {
 const retired=placementAnchor,beforeAnchors=anchors();
 if(change==="side") cases[placement].setSide("right");else if(change==="align") cases[placement].setAlign("end");else cases[placement].setOffset(18);
 await finish();placementAnchor=anchors().find(anchor=>!beforeAnchors.includes(anchor));
 const positioner=popup(placement).closest("[data-sw-menu-positioner]") ?? popup(placement);
 assert(!retired.isConnected && placementAnchor && anchorRectangle(placementAnchor)===placementRectangle && state(placement).open && state(placement).visible,change+" preserves the coordinate anchor through placement recreation");
 assert(positioner.getAttribute("data-"+(change==="offset"?"side-offset":change))===(change==="side"?"right":change==="align"?"end":"18"),change+" updates the requested placement attribute");
}
assert(Math.abs(popup(placement).getBoundingClientRect().left-placementAnchor.getBoundingClientRect().right-18)<2,"placement updates use the retained Runtime point without another activation");cases[placement].setModel("open",false);await finish();
const content="anchor-content";
contextPoint(button(content),200,180);await finish();
const contentAnchor=contextAnchor(200,180),contentRectangle=anchorRectangle(contentAnchor),contentCount=anchors().length;
for(const change of ["parent","class","label","add-item","remove-item","portal"]) {
 if(change==="parent") cases[content].changeParent();else if(change==="class") cases[content].changeClass();else if(change==="label") cases[content].setItemLabel("Updated action");else if(change==="portal") cases[content].place("#portal-b");else cases[content].setExtraItem(change==="add-item");
 await finish();
 assert(contentAnchor.isConnected && anchors().length===contentCount && anchorRectangle(contentAnchor)===contentRectangle && state(content).open && state(content).visible,change+" keeps the existing coordinate anchor through an ordinary update");
 if(change==="parent") assert(query("data-parent-revision",content).textContent==="1","parent state renders its new value");
 if(change==="class") assert(button(content).classList.contains("after"),"ordinary class prop changes");
 if(change==="label") assert(item(content,"alpha").textContent.includes("Updated action"),"item label changes");
 if(change==="add-item" || change==="remove-item") assert(Boolean(query("data-extra-item",content))===(change==="add-item"),change+" changes the item collection");
 if(change==="portal") assert(wrapper(content).parentElement.id==="portal-b","the existing portal reaches its new container");
}
cases[content].setModel("open",false);await finish();
for(const entry of [{name:"ContextMenu",options:{}},{name:"F10",options:{shiftKey:true}}]) {
 button(a).focus();const bounds=button(a).getBoundingClientRect(),expectedX=bounds.left+scrollX,expectedY=bounds.bottom+scrollY;key(button(a),entry.name,entry.options);await finish();
 assert(state(a).visible && document.activeElement===item(a,"alpha") && Math.abs(parseFloat(firstAnchor.style.left)-expectedX)<1 && Math.abs(parseFloat(firstAnchor.style.top)-expectedY)<1,entry.name+" opens at the trigger boundary and focuses the first item "+JSON.stringify({open:state(a).visible,active:document.activeElement?.outerHTML,anchor:firstAnchor.getAttribute("style"),expectedX,expectedY}));
 key(document,"Escape");await finish();assert(!state(a).visible && document.activeElement===button(a),entry.name+" Escape restores its trigger focus");
}
cases[a].setTriggerDisabled(true);await settle();const disabledCallbacks=state(a).callbacks.length;
assert(button(a).tabIndex===-1 && button(a).getAttribute("aria-disabled")==="true" && button(a).hasAttribute("data-disabled"),"disabled div Trigger exposes complete disabled state");
assert(contextPoint(button(a),330,210)===true,"disabled Trigger retains the native context-menu event");key(button(a),"ContextMenu");key(button(a),"F10",{shiftKey:true});touch(button(a),"touchstart");await wait(550);
assert(!state(a).visible && state(a).callbacks.length===disabledCallbacks,"disabled Trigger rejects pointer, both keyboard openings, and touch");cases[a].setTriggerDisabled(false);await settle();
const touchId="touch";
for(const cancel of ["touchend","touchcancel","movement","multiple"]) {
 touch(button(touchId),"touchstart");await wait(25);
 if(cancel === "movement") touch(button(touchId),"touchmove",281,160);else if(cancel === "multiple") touch(button(touchId),"touchmove",270,160,2);else touch(button(touchId),cancel);
 await wait(525);assert(!state(touchId).visible,cancel+" cancels the pending long press");
}
touch(button(touchId),"touchstart",270,160);await wait(300);assert(!state(touchId).visible,"long press waits for the Runtime deadline");await wait(260);
const touchAnchor=contextAnchor(270,160),touchBounds=touchAnchor?.getBoundingClientRect();
assert(state(touchId).visible && touchBounds?.width===10 && touchBounds.height===10,"accepted long press uses the Runtime touch anchor dimensions");touch(button(touchId),"touchend");cases[touchId].setModel("open",false);await finish();
for(const part of ["trigger","popup","root"]) {
 const id="touch-replace";contextPoint(button(id),410,260);await finish();const retiredAnchor=contextAnchor(410,260),retiredTrigger=button(id),count=anchors().length;
 cases[id].setModel("open",false);await finish();touch(retiredTrigger,"touchstart");await wait(30);cases[id].replace(part);await finish();await wait(525);
 assert(!retiredAnchor.isConnected && anchors().length===count && !state(id).visible,part+" replacement removes the old anchor and pending long-press work");
 if(part !== "popup") {contextPoint(retiredTrigger,450,260);await finish();assert(!state(id).visible,part+" retired trigger loses Context listeners");}
 contextPoint(button(id),430,250);await finish();assert(state(id).visible && contextAnchor(430,250)?.isConnected,part+" replacement creates one usable Runtime anchor");cases[id].setModel("open",false);await finish();
}
const pendingId="touch-unmount";contextPoint(button(pendingId),610,310);await finish();const pendingAnchor=contextAnchor(610,310);cases[pendingId].setModel("open",false);await finish();const pendingButton=button(pendingId),anchorCount=anchors().length;touch(pendingButton,"touchstart");await wait(30);cases[pendingId].hide();await wait(550);
assert(!pendingAnchor.isConnected && anchors().length===anchorCount-1 && state(pendingId).visible===null,"unmount releases the anchor and long-press timer");contextPoint(pendingButton,620,320);await finish();assert(anchors().length===anchorCount-1,"retired trigger cannot create another anchor");
contextPoint(button("context-modal"),180,160);await finish();assert(state("context-modal").visible && locked(),"modal Context Menu acquires the Runtime scroll lock");key(document,"Escape");await finish();assert(!state("context-modal").visible && !locked(),"modal Context Menu releases its lock on Escape");
touch(button("touch-replace"),"touchstart");
`;
