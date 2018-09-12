import { IRenderMime } from "@jupyterlab/rendermime-interfaces";
import { JSONObject } from "@phosphor/coreutils";
import { Widget } from "@phosphor/widgets";
import "../style/index.css";
import { cxToJs, cyNetworkUtils } from "cytoscape-cx2js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import RootComponent, { JGraph } from "./Components";
import { element } from "prop-types";

const MIME_TYPE = "application/cx";
const CLASS_NAME = "mimerenderer-cx";

let NetworkName: any = null;

//the class translation from cx to json
export class cy2js {
  DATA: JSONObject;
  constructor(content: JSONObject) {
    this.DATA = content;
  }

  transportation() {
    const utils = new cyNetworkUtils();
    const niceCX = utils.rawCXtoNiceCX(this.DATA);
    const cx2Js = new cxToJs(utils);
    const attributeNameMap = {};
    const elements = cx2Js.cyElementsFromNiceCX(niceCX, attributeNameMap);
    const style = cx2Js.cyStyleFromNiceCX(niceCX, attributeNameMap);
    return [elements, style];
  }
}

/**
 * A widget for rendering cx.
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  convertData = (data: any) => {
    let elements: any;
    let style: any;
    const L = data.length;

    if (L == 13 || L == 12) {
      const utils = new cyNetworkUtils();
      let jsonObject = data;
      const niceCX = utils.rawCXtoNiceCX(jsonObject);
      const cx2Js = new cxToJs(utils);
      const attributeNameMap = {};
      elements = cx2Js.cyElementsFromNiceCX(niceCX, attributeNameMap);
      style = cx2Js.cyStyleFromNiceCX(niceCX, attributeNameMap);
    } else {
      elements = data.elements;
      style = data.style;
    }
    return [elements, style];
  };

  /**
   * Render cx into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {

    return new Promise<void>((resolve, reject) => {
      let data_raw = model.data[this._mimeType] as any;
      const metadata = (model.metadata[this._mimeType] as any) || {};

      const [data_js, style_js] = this.convertData(data_raw);
      let networkname = null;
      var keys = Object.keys(data_raw);
      for (let i = 0; i < keys.length; i++) {
        if ("networkAttributes" in data_raw[i]) {networkname = data_raw[i].networkAttributes[0].v; }
      }

      const data: JGraph = {
        elements: data_js,
        style: style_js
      };
      
      const props = {
        data,
        metadata,
        theme: "cm-s-jupyter",
        registerCy,
        selection,
        networkname
      };
      const component = <RootComponent {...props} />;
      ReactDOM.render(component, this.node, () => {
        resolve();
      });
    });
  }

  private _mimeType: string;
}

let cyRef: any = null;
let selection: any = null;
const registerCy = (cy: any) => {
  cyRef = cy;

  cyRef.on("tap", "node", (evt: any) => {
    selection = evt.target.data();
  });
};

/**
 * A mime renderer factory for cx data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: false,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new OutputWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: "mime-rend1:plugin",
  rendererFactory,
  rank: 10000,
  dataType: "json",
  fileTypes: [
    {
      name: "cx",
      mimeTypes: [MIME_TYPE],
      extensions: [".cx", ".cyjs"]
    }
  ],
  documentWidgetFactoryOptions: {
    name: "cx Viewer",
    primaryFileType: "cx",
    fileTypes: ["cx", "cyjs"],
    defaultFor: ["cx"]
  }
};

export default extension;