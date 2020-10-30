import {Plugin, WorkspaceLeaf} from 'obsidian';

interface PluginData {
    backlinkLeaf: WorkspaceLeaf | null
}

const defaultData: PluginData = {
    backlinkLeaf: null,
}

export default class BacklinksInDocument extends Plugin {
    data: PluginData = defaultData

    async onload() {
        const saved = await this.loadData()

        this.app.workspace.on('layout-ready', () => {
            if (saved.id) {
                const savedBacklinkLeaf = this.app.workspace.getLeafById(saved.id)
                if (savedBacklinkLeaf) {
                    savedBacklinkLeaf.detach()
                }
            }
        })

        this.app.workspace.on('file-open', (file) => {
            const activeLeaf = this.app.workspace.activeLeaf
            if (!activeLeaf) { return }

            const doc = activeLeaf.view.containerEl.querySelector('.mod-root .CodeMirror-lines');
            if (!doc) { return }


            if (!this.data.backlinkLeaf) {
                // @ts-ignore
                const root = this.app.workspace.rootSplit
                // @ts-ignore
                this.data.backlinkLeaf = this.app.workspace.createLeafInParent(root) as WorkspaceLeaf
            }

            const { backlinkLeaf } = this.data

            backlinkLeaf.setViewState({
                type: 'backlink',
                state: {
                    file: file.name,
                }
            }).then(() => {
                const leafEl = backlinkLeaf.view.containerEl.parentNode as HTMLElement
                if (!leafEl) { return }

                leafEl.style.marginTop = '50px'
                doc.appendChild(leafEl)
                // @ts-ignore
                this.saveData({ id: backlinkLeaf.id })
            })
        })
    }

    onunload() {
        console.log('unloading plugin');
    }
}
