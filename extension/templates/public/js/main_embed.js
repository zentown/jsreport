/*! 
 * Copyright(c) 2014 Jan Blaha 
 */

define(["jquery", "app", "marionette", "backbone", "core/view.base", "core/listenerCollection", "./template.model", "./preview", "core/aceBinder", "./template.entityRegistration"],
    function ($, app, Marionette, Backbone, ViewBase, ListenerCollection, TemplateModel, preview, aceBinder, entityRegistration) {

        return app.module("template", function (module) {

            var BasicsView = ViewBase.extend({
                template: "embed-template-basic",

                getRecipes: function () {
                    return app.recipes;
                },

                getEngines: function () {
                    return app.engines;
                }
            });

            var View = ViewBase.extend({
                template: "embed-template",

                events: {
                    "click #saveCommand": "save",
                    "click #previewCommand": "preview",
                    "click #basicSettingsCommand": "basicSettings"
                },

                regions: {
                    extensionsMenuRegion: {
                        selector: "#side-nav-extended-pane"
                    }
                },

                initialize: function() {
                    _.bindAll(this, "renderExtensionsMenu");
                    this. beforeRenderListeners = new ListenerCollection();
                },

                basicSettings: function () {
                    this.extensionsMenuRegion.show(new BasicsView({ model: this.model}), "basic");
                },

                renderExtensionsMenu: function () {
                    this.renderExtensionsMenuContext = { result: "", region: this.extensionsMenuRegion, template: this.model, beforeRenderListeners : this.beforeRenderListeners  };
                    _.extend(this.renderExtensionsMenuContext, Backbone.Events);
                    app.trigger("extensions-menu-render", this.renderExtensionsMenuContext);

                    var originalFn = this.extensionsMenuRegion.show.bind(this.extensionsMenuRegion);

                    var self = this;
                    this.extensionsMenuRegion.show = function(view, id) {
                        originalFn(view);

                        var size = 200;
                        if (id === self.lastMenuVisible &&  $("#side-nav-extended-pane").width()) {
                            id = null;
                            size = 0;
                        }

                        $("#side-nav-extended-pane").width(size);
                        $("#side-nav-divider").animate({ left: size }, 300);
                        $("#main-pane").animate({ left: size }, 300);
                        self.lastMenuVisible = id;
                    }

                    return this.renderExtensionsMenuContext.result;
                },

                onDomRefresh: function () {
                    this.contentEditor = ace.edit("htmlArea");
                    this.contentEditor.setTheme("ace/theme/chrome");
                    this.contentEditor.getSession().setMode("ace/mode/handlebars");
                    aceBinder(this.model, "content", this.contentEditor);

                    this.helpersEditor = ace.edit("helpersArea");
                    this.helpersEditor.setTheme("ace/theme/chrome");
                    this.helpersEditor.getSession().setMode("ace/mode/javascript");
                    aceBinder(this.model, "helpers", this.helpersEditor);

                    this.$el.find(".split-pane").splitPane();

                    if (this.renderExtensionsMenuContext)
                        this.renderExtensionsMenuContext.trigger("after-render", this.$el);
                },

                save: function () {
                    this.model.save();
                },

                preview: function () {
                    preview(this.model, this.beforeRenderListeners, "previewFrame");
                }
            });

            app.on("entity-registration", entityRegistration);

            app.on("open-template", function(shortid) {
                var view = new View({ model: new TemplateModel()});
                view.model.set("shortid", shortid);
                view.model.fetch({
                    success: function () {
                        app.layout.content.show(view);
                    }
                });
            });
        });
    });