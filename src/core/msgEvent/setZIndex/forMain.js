import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethod } from "../base";
import cloneDeep from "lodash/cloneDeep";
import { EDataType, EPostMessageType, ElayerType } from "../../enum";
import { Storage_Selector_key } from "../../../collector";
export class ZIndexNodeMethod extends BaseMsgMethod {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "emitEventType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: EmitEventType.ZIndexNode
        });
        Object.defineProperty(this, "min", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "max", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    get minZIndex() {
        return this.min;
    }
    get maxZIndex() {
        return this.max;
    }
    set maxZIndex(max) {
        this.max = max;
    }
    set minZIndex(min) {
        this.min = min;
    }
    addMaxLayer() {
        this.max = this.max + 1;
    }
    addMinLayer() {
        this.min = this.min - 1;
    }
    collect(data) {
        if (!this.serviceColloctor || !this.mainEngine) {
            return;
        }
        const { workIds, layer, viewId } = data;
        const view = this.control.viewContainerManager.getView(viewId);
        if (!view?.displayer) {
            return;
        }
        const scenePath = view.focusScenePath;
        const keys = [...workIds];
        const store = this.serviceColloctor.storage;
        const localMsgs = [];
        // const serviceMsgs: BaseCollectorReducerAction[] = [];
        const selectIds = [];
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
            let zIndex;
            if (curStore && localWorkId === Storage_Selector_key) {
                if (curStore.selectIds) {
                    selectIds.push(...curStore.selectIds);
                    selectIds.sort((a, b) => {
                        const aZIndex = store[getKey(a, this.serviceColloctor)]?.opt?.zIndex || 0;
                        const bZIndex = store[getKey(a, this.serviceColloctor)]?.opt?.zIndex || 0;
                        if (aZIndex > bZIndex) {
                            return 1;
                        }
                        else if (a < b) {
                            return -1;
                        }
                        else {
                            return 0;
                        }
                    });
                    const updateNodeOpt = curStore.updateNodeOpt || {};
                    updateNodeOpt.zIndexLayer = layer;
                    const taskData = {
                        workId: curKey,
                        msgType: EPostMessageType.UpdateNode,
                        dataType: EDataType.Local,
                        updateNodeOpt,
                        emitEventType: this.emitEventType,
                        willRefreshSelector: true,
                        willSyncService: true,
                        viewId
                    };
                    const subStore = new Map();
                    if (layer === ElayerType.Top) {
                        this.addMaxLayer();
                        zIndex = this.max;
                    }
                    else {
                        this.addMinLayer();
                        zIndex = this.min;
                    }
                    selectIds.forEach((name) => {
                        const isLocalId = this.serviceColloctor?.isLocalId(name);
                        let key = isLocalId && this.serviceColloctor?.transformKey(name) || name;
                        const curStore = store[viewId][scenePath][key];
                        if (!isLocalId && this.serviceColloctor?.isOwn(key)) {
                            key = this.serviceColloctor.getLocalId(key);
                        }
                        updateNodeOpt.zIndex = zIndex;
                        if (curStore?.opt) {
                            curStore.opt.zIndex = zIndex;
                        }
                        curStore?.opt && subStore.set(key, {
                            updateNodeOpt: curStore.updateNodeOpt,
                            opt: curStore.opt,
                        });
                    });
                    taskData.selectStore = subStore;
                    taskData.willSerializeData = true;
                    localMsgs.push(taskData);
                }
                continue;
            }
            // if (curStore) {
            //     if (layer === ElayerType.Top) {
            //         this.addMaxLayer();
            //         zIndex = this.max;
            //     } else {
            //         this.addMinLayer();
            //         zIndex = this.min;
            //     }
            //     const opt = curStore.opt;
            //     const updateNodeOpt = curStore.updateNodeOpt || {};
            //     if (opt) {
            //         updateNodeOpt.zIndex = zIndex;
            //         opt.zIndex = zIndex;
            //         serviceMsgs.push({
            //             ...curStore,
            //             type: EPostMessageType.UpdateNode,
            //             opt
            //         });
            //         if (!selectIds.includes(curKeyStr)) {
            //             let localWorkId:string | undefined = curKeyStr;
            //             if (!isLocalId && this.serviceColloctor.isOwn(localWorkId)) {
            //                 localWorkId = this.serviceColloctor.getLocalId(localWorkId);
            //             }
            //             localMsgs.push({
            //                 workId: localWorkId,
            //                 msgType: EPostMessageType.UpdateNode,
            //                 dataType: EDataType.Local,
            //                 updateNodeOpt,
            //                 emitEventType: this.emitEventType,
            //                 willSyncService: false,
            //                 willRefresh: true,
            //                 viewId
            //             })
            //         }
            //     }
            // }
        }
        if (localMsgs.length) {
            this.collectForLocalWorker(localMsgs);
        }
        // if (serviceMsgs.length) {
        //     this.collectForServiceWorker(serviceMsgs);
        // }
        function getKey(name, serviceColloctor) {
            const isLocalId = serviceColloctor.isLocalId(name);
            return isLocalId && serviceColloctor.transformKey(name) || name;
        }
    }
}
