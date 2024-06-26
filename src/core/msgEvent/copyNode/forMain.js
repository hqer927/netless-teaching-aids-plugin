import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethod } from "../base";
import { EDataType, EPostMessageType, EToolsKey, EvevtWorkState } from "../../enum";
import cloneDeep from "lodash/cloneDeep";
import { transformToNormalData, transformToSerializableData } from "../../../collector/utils";
import { Storage_Selector_key } from "../../../collector";
import { ETextEditorType } from "../../../component/textEditor";
export class CopyNodeMethod extends BaseMsgMethod {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "emitEventType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: EmitEventType.CopyNode
        });
    }
    collect(data) {
        if (!this.serviceColloctor || !this.mainEngine) {
            return;
        }
        const { workIds, viewId } = data;
        const view = this.control.viewContainerManager.getView(viewId);
        if (!view?.displayer) {
            return;
        }
        const scenePath = view.focusScenePath;
        const keys = [...workIds];
        const store = this.serviceColloctor?.storage;
        const localMsgs = [];
        const serviceMsgs = [];
        const random = Math.floor(Math.random() * 30 + 1);
        let translate = [random, random];
        const undoTickerId = Date.now();
        while (keys.length) {
            const curKey = keys.pop();
            if (!curKey) {
                continue;
            }
            const curKeyStr = curKey.toString();
            const isLocalId = this.serviceColloctor.isLocalId(curKeyStr);
            const key = isLocalId ? this.serviceColloctor.transformKey(curKey) : curKeyStr;
            let localWorkId = curKeyStr;
            if (!isLocalId && this.serviceColloctor.isOwn(localWorkId)) {
                localWorkId = this.serviceColloctor.getLocalId(localWorkId);
            }
            const curStore = cloneDeep(store[viewId][scenePath][key]);
            if (curStore && localWorkId === Storage_Selector_key) {
                if (curStore.selectIds) {
                    const bgRect = view.displayer.canvasBgRef.current?.getBoundingClientRect();
                    const floatBarRect = view.displayer?.floatBarCanvasRef.current?.getBoundingClientRect();
                    const bgCenter = bgRect && [bgRect.x + bgRect.width / 2, bgRect.y + bgRect.height / 2];
                    const floatBarCenter = floatBarRect && [floatBarRect.x + floatBarRect.width / 2, floatBarRect.y + floatBarRect.height / 2];
                    const scale = view.cameraOpt?.scale || 1;
                    translate = bgCenter && floatBarCenter && [(bgCenter[0] - floatBarCenter[0] + random) / scale, (bgCenter[1] - floatBarCenter[1] + random) / scale] || [random / scale, random / scale];
                    keys.push(...curStore.selectIds);
                }
                continue;
            }
            if (curStore && curStore.toolsType === EToolsKey.Text && curStore.opt && curStore.opt.workState && curStore.opt.workState !== EvevtWorkState.Done) {
                const cameraOpt = view.cameraOpt;
                const bgCenter = cameraOpt && [cameraOpt.centerX, cameraOpt.centerY];
                const opt = curStore.opt;
                const textCenter = opt.boxPoint && opt.boxSize && [opt.boxPoint[0] + opt.boxSize[0] / 2, opt.boxPoint[1] + opt.boxSize[1] / 2];
                const scale = cameraOpt?.scale || 1;
                translate = bgCenter && textCenter && [bgCenter[0] - textCenter[0] + random, bgCenter[1] - textCenter[1] + random] || [random / scale, random / scale];
            }
            if (curStore) {
                const now = Date.now();
                const copyNodeKey = (isLocalId ? curKey : this.serviceColloctor.getLocalId(curKey.toString())) + '-' + now;
                const updateNodeOpt = { useAnimation: false };
                if (curStore.toolsType === EToolsKey.Text && curStore.opt) {
                    const opt = curStore.opt;
                    if (opt && opt.boxPoint && opt.text) {
                        opt.workState = EvevtWorkState.Done;
                        const oldBoxPoint = opt.boxPoint;
                        opt.boxPoint = [oldBoxPoint[0] + translate[0], oldBoxPoint[1] + translate[1]];
                        opt.workState = EvevtWorkState.Done;
                        const point = this.control.viewContainerManager.transformToOriginPoint(opt.boxPoint, viewId);
                        this.control.textEditorManager.createTextForMasterController({
                            workId: Date.now().toString(),
                            x: point[0],
                            y: point[1],
                            opt,
                            scale: view.cameraOpt?.scale || 1,
                            type: ETextEditorType.Text,
                            isActive: false,
                            viewId,
                            scenePath
                        });
                    }
                    continue;
                }
                if (curStore.ops) {
                    const op = transformToNormalData(curStore.ops).map((n, index) => {
                        const i = index % 3;
                        if (i === 0) {
                            return n + translate[0];
                        }
                        if (i === 1) {
                            return n + translate[1];
                        }
                        return n;
                    });
                    const newOps = transformToSerializableData(op);
                    curStore.ops = newOps;
                    serviceMsgs.push({
                        ...curStore,
                        updateNodeOpt,
                        type: EPostMessageType.FullWork,
                        workId: copyNodeKey,
                        undoTickerId,
                        viewId,
                        scenePath
                    });
                    localMsgs.push({
                        ...curStore,
                        updateNodeOpt,
                        workId: copyNodeKey,
                        msgType: EPostMessageType.FullWork,
                        dataType: EDataType.Local,
                        emitEventType: this.emitEventType,
                        willSyncService: false,
                        willRefresh: true,
                        viewId
                    });
                }
            }
        }
        this.mainEngine.internalMsgEmitter.emit('undoTickerStart', undoTickerId, viewId);
        if (localMsgs.length) {
            this.collectForLocalWorker(localMsgs);
        }
        if (serviceMsgs.length) {
            this.collectForServiceWorker(serviceMsgs);
        }
    }
}
