/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rect, Group, Label, Polyline } from "spritejs";
import { EPostMessageType, EScaleType, EToolsKey } from "../enum";
import { BaseShapeTool } from "./base";
import cloneDeep from "lodash/cloneDeep";
import { getRectScaleed, getRectTranslated } from "../utils";
import isBoolean from "lodash/isBoolean";
export class TextShape extends BaseShapeTool {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "canRotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "scaleType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: EScaleType.all
        });
        Object.defineProperty(this, "toolsType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: EToolsKey.Text
        });
        Object.defineProperty(this, "tmpPoints", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "workOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "oldRect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.workOptions = props.toolsOpt;
    }
    consume() {
        return {
            type: EPostMessageType.None
        };
    }
    consumeAll() {
        return {
            type: EPostMessageType.None
        };
    }
    draw(props) {
        const { workId, layer, isDrawLabel } = props;
        this.fullLayer.getElementsByName(workId).map(o => o.remove());
        this.drawLayer?.getElementsByName(workId).map(o => o.remove());
        const { boxSize, boxPoint } = this.workOptions;
        const worldPosition = layer.worldPosition;
        const worldScaling = layer.worldScaling;
        if (!boxPoint || !boxSize) {
            return undefined;
        }
        const group = new Group({
            name: workId,
            id: workId,
            pos: [boxPoint[0] + boxSize[0] / 2, boxPoint[1] + boxSize[1] / 2],
            anchor: [0.5, 0.5],
            size: boxSize
        });
        const rect = {
            x: boxPoint[0],
            y: boxPoint[1],
            w: boxSize[0],
            h: boxSize[1]
        };
        const node = new Rect({
            normalize: true,
            pos: [0, 0],
            size: boxSize,
        });
        const labels = isDrawLabel && TextShape.createLabels(this.workOptions, layer) || [];
        group.append(...labels, node);
        layer.append(group);
        return {
            x: Math.floor(rect.x * worldScaling[0] + worldPosition[0]),
            y: Math.floor(rect.y * worldScaling[1] + worldPosition[1]),
            w: Math.floor(rect.w * worldScaling[0]),
            h: Math.floor(rect.h * worldScaling[1])
        };
    }
    consumeService(props) {
        const workId = this.workId?.toString();
        if (!workId) {
            return;
        }
        const { isFullWork, replaceId, isDrawLabel } = props;
        this.oldRect = replaceId && this.vNodes.get(replaceId)?.rect || undefined;
        const layer = isFullWork ? this.fullLayer : (this.drawLayer || this.fullLayer);
        const rect = this.draw({ workId, layer, isDrawLabel });
        this.vNodes.setInfo(workId, {
            rect,
            op: [],
            opt: this.workOptions,
            toolsType: this.toolsType,
            scaleType: this.scaleType,
            canRotate: this.canRotate,
            centerPos: rect && BaseShapeTool.getCenterPos(rect, layer)
        });
        return rect;
    }
    updataOptService(updateNodeOpt) {
        // console.log('updataOptService-text', updateNodeOpt)
        if (!this.workId) {
            return;
        }
        const workId = this.workId.toString();
        const { fontColor, fontBgColor, bold, italic, lineThrough, underline } = updateNodeOpt;
        const info = this.vNodes.get(workId);
        if (!info) {
            return;
        }
        if (fontColor) {
            info.opt.fontColor = fontColor;
        }
        if (fontBgColor) {
            info.opt.fontBgColor = fontBgColor;
        }
        if (bold) {
            info.opt.bold = bold;
        }
        if (italic) {
            info.opt.italic = italic;
        }
        if (isBoolean(lineThrough)) {
            info.opt.lineThrough = lineThrough;
        }
        if (isBoolean(underline)) {
            info.opt.underline = underline;
        }
        if (fontBgColor) {
            info.opt.fontBgColor = fontBgColor;
        }
        this.oldRect = info.rect;
        const rect = this.draw({
            workId,
            layer: this.fullLayer,
            isDrawLabel: false
        });
        this.vNodes.setInfo(workId, {
            rect,
            op: [],
            opt: this.workOptions,
            toolsType: this.toolsType,
            scaleType: this.scaleType,
            canRotate: this.canRotate,
            centerPos: rect && BaseShapeTool.getCenterPos(rect, this.fullLayer)
        });
        return rect;
    }
    clearTmpPoints() {
        this.tmpPoints.length = 0;
    }
    static getFontWidth(param) {
        const { ctx, opt, text } = param;
        const { bold, italic, fontSize, fontFamily } = opt;
        ctx.font = `${bold} ${italic} ${fontSize}px ${fontFamily}`;
        return ctx.measureText(text).width;
    }
    static createLabels(textOpt, layer) {
        const labels = [];
        const arr = textOpt.text.split(',');
        const length = arr.length;
        // console.log('textOpt.text', textOpt.text, textOpt.boxSize, layer.worldScaling)
        for (let i = 0; i < length; i++) {
            const text = arr[i];
            const { fontSize, lineHeight, bold, textAlign, italic, boxSize, fontFamily, verticalAlign, fontColor, underline, lineThrough } = textOpt;
            const _lineHeight = lineHeight || fontSize * 1.2;
            const ctx = layer && layer.parent.canvas.getContext('2d');
            const width = ctx && TextShape.getFontWidth({ text, opt: textOpt, ctx, worldScaling: layer.worldScaling });
            if (width) {
                const attr = {
                    anchor: [0, 0.5],
                    text,
                    fontSize: fontSize,
                    lineHeight: _lineHeight,
                    fontFamily: fontFamily,
                    fontWeight: bold,
                    // fillColor: '#000',
                    fillColor: fontColor,
                    // bgcolor: textOpt.fontBgColor,
                    textAlign: textAlign,
                    fontStyle: italic,
                    name: i.toString(),
                    className: 'label'
                };
                const pos = [0, 0];
                if (verticalAlign === 'middle') {
                    const center = (length - 1) / 2;
                    pos[1] = (i - center) * _lineHeight;
                }
                if (textAlign === 'left') {
                    pos[0] = boxSize && -boxSize[0] / 2 + 5 || 0;
                }
                // if (textOpt.textAlign === 'right') {
                //     pos[0] = rect.w / 2;
                //     attr.anchor = [0.5, 0.5];
                // }
                attr.pos = pos;
                const label = new Label(attr);
                labels.push(label);
                if (underline) {
                    // console.log('textOpt.text--1', attr.pos)
                    const underlineAttr = {
                        normalize: false,
                        pos: [attr.pos[0], attr.pos[1] + fontSize / 2],
                        lineWidth: 2,
                        points: [0, 0, width, 0],
                        strokeColor: fontColor,
                        name: `${i}_underline`,
                        className: 'underline'
                    };
                    const underlineNode = new Polyline(underlineAttr);
                    labels.push(underlineNode);
                }
                if (lineThrough) {
                    const lineThroughAttr = {
                        normalize: false,
                        pos: attr.pos,
                        lineWidth: 2,
                        points: [0, 0, width, 0],
                        strokeColor: fontColor,
                        name: `${i}_lineThrough`,
                        className: 'lineThrough'
                    };
                    const lineThroughNode = new Polyline(lineThroughAttr);
                    labels.push(lineThroughNode);
                }
                // console.log('textOpt.text--1', text, width, label.getBoundingClientRect());
            }
        }
        return labels;
    }
    static updateNodeOpt(param) {
        const { node, opt, vNodes, targetNode } = param;
        const { fontBgColor, fontColor, translate, box, boxScale, boxTranslate, workState, bold, italic, lineThrough, underline, fontSize } = opt;
        // let rect:IRectType|undefined;
        const nodeOpt = targetNode && cloneDeep(targetNode) || vNodes.get(node.name);
        if (!nodeOpt)
            return;
        const layer = node.parent;
        if (!layer)
            return;
        const _Opt = nodeOpt.opt;
        _Opt.workState = workState;
        if (fontColor) {
            if (_Opt.fontColor) {
                _Opt.fontColor = fontColor;
            }
        }
        if (fontBgColor) {
            if (_Opt.fontBgColor) {
                _Opt.fontBgColor = fontBgColor;
            }
        }
        if (bold) {
            _Opt.bold = bold;
        }
        if (italic) {
            _Opt.italic = italic;
        }
        if (isBoolean(lineThrough)) {
            _Opt.lineThrough = lineThrough;
        }
        if (isBoolean(underline)) {
            _Opt.underline = underline;
        }
        if (fontSize) {
            const { boxSize } = _Opt;
            const scale = fontSize / _Opt.fontSize;
            const newBoxSize = boxSize && [boxSize[0] * scale, boxSize[1] * scale];
            if (newBoxSize) {
                _Opt.boxSize = newBoxSize;
                _Opt.fontSize = fontSize;
                nodeOpt.rect = {
                    x: nodeOpt.rect.x,
                    y: nodeOpt.rect.y,
                    w: newBoxSize[0],
                    h: newBoxSize[1],
                };
            }
        }
        if (box && boxTranslate && boxScale) {
            const { boxSize, fontSize } = _Opt;
            const oldRect = nodeOpt.rect;
            const newRect = getRectTranslated(getRectScaleed(oldRect, boxScale), boxTranslate);
            _Opt.boxPoint = newRect && [(newRect.x - layer.worldPosition[0]) / layer.worldScaling[0], (newRect.y - layer.worldPosition[1]) / layer.worldScaling[1]];
            _Opt.boxSize = boxSize && [boxSize[0] * boxScale[0], boxSize[1] * boxScale[1]];
            _Opt.fontSize = fontSize && fontSize * boxScale[0];
        }
        else if (translate && _Opt.boxPoint) {
            _Opt.boxPoint = [_Opt.boxPoint[0] + translate[0], _Opt.boxPoint[1] + translate[1]];
            nodeOpt.centerPos = [nodeOpt.centerPos[0] + translate[0], nodeOpt.centerPos[1] + translate[1]];
            nodeOpt.rect = {
                x: nodeOpt.rect.x + translate[0],
                y: nodeOpt.rect.y + translate[1],
                w: nodeOpt.rect.w,
                h: nodeOpt.rect.h,
            };
        }
        nodeOpt && vNodes.setInfo(node.name, nodeOpt);
        // console.log('targetNode', targetNode, vNodes.get(node.name))
        return nodeOpt?.rect;
    }
    static getRectFromLayer(layer, name) {
        const node = layer.getElementsByName(name)[0];
        if (node) {
            const r = node.getBoundingClientRect();
            return {
                x: Math.floor(r.x),
                y: Math.floor(r.y),
                w: Math.floor(r.width),
                h: Math.floor(r.height)
            };
        }
        return undefined;
    }
}
