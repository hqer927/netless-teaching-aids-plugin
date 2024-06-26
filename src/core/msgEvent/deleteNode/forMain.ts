import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethod } from "../base";
import { IWorkerMessage, IworkId } from "../../types";
import { EDataType, EPostMessageType, EToolsKey } from "../../enum";

export type DeleteNodeEmtData = {
    workIds: IworkId[];
    viewId: string;
}
export class DeleteNodeMethod extends BaseMsgMethod {
    readonly emitEventType: EmitEventType = EmitEventType.DeleteNode;
    collect(data: DeleteNodeEmtData): void {
        if (!this.serviceColloctor || !this.mainEngine) {
            return;
        }
        const { workIds, viewId } = data;
        const view =  this.control.viewContainerManager.getView(viewId);
        if (!view?.displayer) {
            return ;
        }
        const scenePath = view.focusScenePath;
        const store = this.serviceColloctor.storage;
        const keys = [...workIds];
        const localMsgs: IWorkerMessage[] = [];
        // const serviceMsgs: BaseCollectorReducerAction[] = [];
        const removeIds:string[] = [];
        const undoTickerId = Date.now();
        while (keys.length) {
            const curKey = keys.pop();
            if (!curKey) {
                continue;
            }
            const curKeyStr = curKey.toString()
            const isLocalId:boolean = this.serviceColloctor.isLocalId(curKeyStr);
            const key = isLocalId ? this.serviceColloctor.transformKey(curKey) : curKeyStr;
            const curStore = store[viewId][scenePath][key];
            if (curStore) {
                let localWorkId:string | undefined = curKeyStr ;
                if (!isLocalId && this.serviceColloctor.isOwn(localWorkId)) {
                    localWorkId = this.serviceColloctor.getLocalId(localWorkId);
                }
                if (curStore.toolsType === EToolsKey.Text) {
                    this.control.textEditorManager.delete(localWorkId, true, true);
                    continue;
                }
                removeIds.push(localWorkId);
            }
        }
        localMsgs.push({
            msgType: EPostMessageType.RemoveNode,
            emitEventType: EmitEventType.DeleteNode,
            removeIds,
            dataType: EDataType.Local,
            willSyncService: true,
            willRefresh: true,
            undoTickerId,
            viewId
        });
        this.mainEngine.internalMsgEmitter.emit('undoTickerStart', undoTickerId, viewId);
        if (localMsgs.length) {
            this.collectForLocalWorker(localMsgs);
        }
    }
}