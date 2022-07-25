import * as fs from 'fs'
import { ClassModel } from "../lua/model/ClassModel";

export class ModelUIManager {
  
  readonly leftPanel: HTMLDivElement;
  readonly centerPanel: HTMLDivElement;
  readonly rightPanel: HTMLDivElement;

  readonly modelPane: HTMLDivElement;
  readonly $modelPane: JQuery;

  constructor() {
    this.leftPanel = $('.left-panel').get(0) as HTMLDivElement;
    this.centerPanel = $('.center-panel').get(0) as HTMLDivElement;
    this.rightPanel = $('.right-panel').get(0) as HTMLDivElement;

    this.modelPane = $(this.centerPanel).find('.model-pane').get(0);
    this.$modelPane = $(this.modelPane);

    ClassModel.HTML_TEMPLATE = fs.readFileSync('./assets/html/model_class_template.html').toString();
    console.log(ClassModel.HTML_TEMPLATE);
  }

}
