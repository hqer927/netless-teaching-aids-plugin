import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethodForWorker } from "../baseForWorker";
import { ECanvasShowType, EDataType, EPostMessageType } from "../../enum";
import { SelectorShape } from "../../tools";
import { isIntersect, isSealedGroup } from "../../utils";
export class ZIndexActiveMethodForWorker extends BaseMsgMethodForWorker {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "emitEventType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: EmitEventType.ZIndexActive
        });
    }
    consume(data) {
        const { msgType, dataType, emitEventType } = data;
        if (msgType !== EPostMessageType.UpdateNode)
            return;
        if (dataType === EDataType.Local && emitEventType === this.emitEventType) {
            this.consumeForLocalWorker(data);
            return true;
        }
    }
    consumeForLocalWorker(data) {
        const { workId, isActiveZIndex, willRefreshSelector } = data;
        if (workId !== SelectorShape.selectorId) {
            return;
        }
        const workShapeNode = this.localWork?.workShapes.get(SelectorShape.selectorId);
        if (!workShapeNode) {
            return;
        }
        const rect = workShapeNode.oldSelectRect;
        if (isActiveZIndex && rect && this.localWork) {
            const sealToDrawIds = new Set();
            this.localWork.vNodes.curNodeMap.forEach((value, key) => {
                if (isIntersect(rect, value.rect)) {
                    sealToDrawIds.add(key);
                }
            });
            if (sealToDrawIds.size) {
                const sealToDrawNodes = [];
                sealToDrawIds.forEach(name => {
                    this.localWork?.fullLayer.getElementsByName(name).forEach(c => {
                        const cloneP = c.cloneNode(true);
                        if (isSealedGroup(c)) {
                            cloneP.seal();
                        }
                        if (!this.localWork?.drawLayer?.getElementsByName(name).length) {
                            sealToDrawNodes.push(cloneP);
                        }
                    });
                });
                if (sealToDrawNodes.length) {
                    this.localWork.drawLayer?.append(...sealToDrawNodes);
                }
            }
        }
        else {
            this.localWork?.drawLayer?.children.filter(c => !workShapeNode.selectIds?.includes(c.name)).forEach(r => r.remove());
        }
        if (willRefreshSelector) {
            // console.log('render', rect, workShapeNode.selectIds, this.localWork?.fullLayer.children.map(n=>n.name), this.localWork?.drawLayer?.children.map(n=>n.name))
            this.localWork?._post({
                render: [
                    {
                        rect,
                        drawCanvas: ECanvasShowType.Selector,
                        clearCanvas: ECanvasShowType.Selector,
                        isClear: true,
                        isFullWork: false,
                        viewId: this.localWork.viewId
                    }
                ],
                sp: [{
                        type: EPostMessageType.Select,
                        selectIds: workShapeNode.selectIds,
                        opt: workShapeNode.getWorkOptions(),
                        selectRect: rect,
                        strokeColor: workShapeNode.strokeColor,
                        fillColor: workShapeNode.fillColor,
                        willSyncService: false,
                        isSync: true
                    }]
            });
        }
    }
}
