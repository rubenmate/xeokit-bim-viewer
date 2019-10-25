import {Controller} from "../Controller.js";


/**
 * Manages the objects tree.
 *
 * Located at {@link Explorer#objects}.
 */
class ObjectsTree extends Controller {

    /** @private */
    constructor(parent, cfg = {}) {

        super(parent);

        this._modelNodeIDs = {}; // For each model, an array of IDs of tree nodes

        this._muteTreeEvents = false;
        this._muteEntityEvents = false;

        this._tree = new InspireTree({
            selection: {
                autoSelectChildren: true,
                autoDeselect: true,
                mode: 'checkbox'
            },
            checkbox: {
                autoCheckChildren: true
            },
            data: []
        });

        new InspireTreeDOM(this._tree, {
            target: document.getElementById(cfg.objectsTreePanelId)
        });

        this._tree.on("model.loaded", () => {

            this._tree.select();

            // this._tree.model.expand();
            // if (this._tree.model.length > 0) {
            //     this._tree.model[0].children[0].expand();
            //     this._tree.model[0].children[0].children[0].expand();
            // }

            this._tree.on('node.selected', (event, node) => {
                if (this._muteTreeEvents) {
                    return;
                }
                const objectId = event.id;
                const entity = this.viewer.scene.objects[objectId];
                if (entity) {
                    this._muteEntityEvents = true;
                    entity.visible = true;
                    this._muteEntityEvents = false;
                }
            });

            this._tree.on('node.deselected', (event, node) => {
                if (this._muteTreeEvents) {
                    return;
                }
                const objectId = event.id;
                const entity = this.viewer.scene.objects[objectId];
                if (entity) {
                    this._muteEntityEvents = true;
                    entity.visible = false;
                    this._muteEntityEvents = false;
                }
            });

            this.viewer.scene.on("objectVisibility", (entity) => {
                // if (this._muteEntityEvents) {
                //     return;
                // }
                // const node = this._tree.node(entity.id);
                // if (!node) {
                //     return;
                // }
                // this._muteTreeEvents = true;
                // entity.visible ? node.check(true) : node.uncheck(true);
                // this._muteTreeEvents = false;
            });
        });
    }

    _addModel(modelId) {
        const data = [];
        const metaModels = this.viewer.metaScene.metaModels;
        const metaModel = metaModels[modelId];
        this._visit(true, data, metaModel.rootMetaObject);
        const modelNodeIDs = [];
        for (var i = 0, len = data.length; i < len; i++) {
            modelNodeIDs.push(data[i].id);
        }
        this._modelNodeIDs[modelId] = modelNodeIDs;
        this._tree.addNodes(data);
    }

    _removeModel(modelId) {
        const modelNodeIDs = this._modelNodeIDs[modelId];
        for (var i = 0, len = modelNodeIDs.length; i < len; i++) {
            const nodeId = modelNodeIDs[i];
            const node = this._tree.node(nodeId);
            if (!node) {
                continue;
            }
            node.remove(true);
        }
    }

    _visit(expand, data, metaObject) {
        if (!metaObject) {
            return;
        }
        const child = {
            id: metaObject.id,
            text: metaObject.name || ("(" + metaObject.type + ")")
        };
        data.push(child);
        const children = metaObject.children;
        if (children) {
            child.children = [];
            for (var i = 0, len = children.length; i < len; i++) {
                this._visit(true, child.children, children[i]);
            }
        }
    }

    _synchWithScene() {
        this._muteTreeEvents = true;
        const objectIds = this.viewer.scene.objectIds;
        const objects = this.viewer.scene.objects;
        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const node = this._tree.node(objectId);
            if (!node) {
                return;
            }
            objects[objectId].visible ? node.check(true) : node.uncheck(true);
        }
        this._muteTreeEvents = false;
    }

    muteEvents() {
        this._muteTreeEvents = true;
        this._muteEntityEvents = true;
    }

    unmuteEvents() {
        this._muteTreeEvents = false;
        this._muteEntityEvents = false;
    }

    selectAll() {
        this._tree.selectDeep();
    }

    deselectAll() {
        this._tree.deselectDeep();
    }

    destroy() {
        super.destroy();
    }
}

export {ObjectsTree};