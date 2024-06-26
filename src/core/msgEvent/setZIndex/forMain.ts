import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethod } from "../base";
import { IUpdateNodeOpt, IWorkerMessage, IworkId } from "../../types";
import cloneDeep from "lodash/cloneDeep";
import { EDataType, EPostMessageType, ElayerType } from "../../enum";
// import { BaseCollectorReducerAction } from "../../../collector/types";
import { BaseShapeOptions } from "../../tools";
import { Collector, Storage_Selector_key } from "../../../collector";

export type ZIndexNodeEmtData = {
    workIds: IworkId[],
    layer: ElayerType,
    viewId: string;
}
export class ZIndexNodeMethod extends BaseMsgMethod {
    readonly emitEventType: EmitEventType = EmitEventType.ZIndexNode;
    private min = 0;
    private max = 0;
    get minZIndex() : number {
        return this.min
    }
    get maxZIndex() : number {
        return this.max
    }
    set maxZIndex(max : number) {
        this.max = max;
    }
    set minZIndex(min : number) {
        this.min = min;
    }
    addMaxLayer() : void {
        this.max = this.max + 1;
    }
    addMinLayer() : void {
        this.min = this.min - 1;
    }
    collect(data: ZIndexNodeEmtData): void {
        if (!this.serviceColloctor || !this.mainEngine) {
            return;
        }
        const {workIds, layer, viewId} = data;
        const view =  this.control.viewContainerManager.getView(viewId);
        if (!view?.displayer) {
            return ;
        }
        const scenePath = view.focusScenePath;
        const keys = [...workIds];
        const store = this.serviceColloctor.storage;
        const localMsgs: IWorkerMessage[] = [];
        // const serviceMsgs: BaseCollectorReducerAction[] = [];
        const selectIds: string[] = [];
        while (keys.length) {
            const curKey = keys.pop();
            if (!curKey) {
                continue;
            }
            const curKeyStr = curKey.toString()
            const isLocalId:boolean = this.serviceColloctor.isLocalId(curKeyStr);
            const key = isLocalId ? this.serviceColloctor.transformKey(curKey) : curKeyStr;
            let localWorkId:string | undefined = curKeyStr ;
            if (!isLocalId && this.serviceColloctor.isOwn(localWorkId)) {
                localWorkId = this.serviceColloctor.getLocalId(localWorkId);
            }
            const curStore = cloneDeep(store[viewId][scenePath][key]);
            let zIndex:number|undefined;
            if (curStore && localWorkId === Storage_Selector_key) {
                if (curStore.selectIds) {
                    selectIds.push(...curStore.selectIds);
                    selectIds.sort((a,b)=>{
                        const aZIndex = store[getKey(a, this.serviceColloctor as Collector)]?.opt?.zIndex || 0;
                        const bZIndex = store[getKey(a, this.serviceColloctor as Collector)]?.opt?.zIndex || 0;
                        if (aZIndex > bZIndex) {
                            return 1;
                        } else if (a < b) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                    const updateNodeOpt = curStore.updateNodeOpt || {}
                    updateNodeOpt.zIndexLayer = layer;
                    const taskData: IWorkerMessage = {
                        workId: curKey,
                        msgType: EPostMessageType.UpdateNode,
                        dataType: EDataType.Local,
                        updateNodeOpt,
                        emitEventType: this.emitEventType,
                        willRefreshSelector: true,
                        willSyncService: true,
                        viewId
                    };
                    const subStore: Map<string, {
                        opt: BaseShapeOptions;
                        updateNodeOpt?: IUpdateNodeOpt;
                    }> = new Map();
                    if (layer === ElayerType.Top) {
                        this.addMaxLayer();
                        zIndex = this.max;
                    } else {
                        this.addMinLayer();
                        zIndex = this.min;
                    }
                    selectIds.forEach((name)=> {
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
                        })
                    })
                    taskData.selectStore = subStore;
                    taskData.willSerializeData = true;
                    localMsgs.push(taskData)
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
        function getKey(name:string, serviceColloctor: Collector) {
            const isLocalId = serviceColloctor.isLocalId(name);
            return isLocalId && serviceColloctor.transformKey(name) || name;
        }
    }
}