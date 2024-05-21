import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethodForWorker } from "../baseForWorker";
import { IWorkerMessage } from "../../types";
export declare class SetShapeOptMethodForWorker extends BaseMsgMethodForWorker {
    readonly emitEventType: EmitEventType;
    consume(data: IWorkerMessage): boolean | undefined;
    consumeForLocalWorker(data: IWorkerMessage): Promise<void>;
    private updateSelectorCallback;
}