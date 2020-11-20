import {MarkdownPreviewView, MarkdownView, Plugin, TFile, Workspace, WorkspaceLeaf} from 'obsidian';

interface WorkspaceLeafExt extends WorkspaceLeaf {
    id: string
}

interface WorkspaceExt extends Workspace {
    rootSplit: WorkspaceLeaf
    createLeafInParent: (w: WorkspaceLeaf) => WorkspaceLeafExt
}

interface PluginData {
    prBacklinkLeaf: WorkspaceLeafExt | null
    mdBacklinkLeaf: WorkspaceLeafExt | null
}

const defaultData: PluginData = {
    prBacklinkLeaf: null,
    mdBacklinkLeaf: null
}

export default class BacklinksInDocument extends Plugin {
    data: PluginData = defaultData

    get hasOpenedMdFiles() {
        return this.app.workspace.getLeavesOfType('markdown').length !== 0
    }

    get isPluginLeafExists() {
        const openedBacklinksLeaves = this.app.workspace.getLeavesOfType('backlink').map((e: WorkspaceLeaf & {id: string}) => e?.id)
        return openedBacklinksLeaves.includes(this.data.prBacklinkLeaf?.id)
            && openedBacklinksLeaves.includes(this.data.mdBacklinkLeaf?.id)
    }

    createPluginLeaf() {
        const workspace = this.app.workspace as WorkspaceExt
        const root = workspace.rootSplit
        this.data.mdBacklinkLeaf = workspace.createLeafInParent(root)
        this.data.prBacklinkLeaf = workspace.createLeafInParent(root)
    }

    removeLeaf(id: string) {
        const leaf = this.app.workspace.getLeafById(id)
        leaf?.detach()
    }

    clear() {
        this.data.prBacklinkLeaf?.detach()
        this.data.mdBacklinkLeaf?.detach()
    }

    async updateBacklinks(file: TFile) {
        if (!file) { return }
        const { prBacklinkLeaf, mdBacklinkLeaf } = this.data

        console.log(file)
        await prBacklinkLeaf?.setViewState({
            type: 'backlink',
            state: {
                file: file.path,
            }
        })

        await mdBacklinkLeaf?.setViewState({
            type: 'backlink',
            state: {
                file: file.path,
            }
        })

    }

    async onload() {
        const saved = await this.loadData()

        this.app.workspace.on('layout-ready', () => {
            saved.ids.forEach((id: string) => this.removeLeaf(id))
        })

        this.app.workspace.on('file-open', async (file) => {
            const activeLeaf = this.app.workspace.activeLeaf
            if (!activeLeaf) { return }

            const activeView = activeLeaf.view

            const isAllowedView = activeView instanceof MarkdownView || activeView instanceof MarkdownPreviewView

            const isBacklinkView = activeView.getState().hasOwnProperty('backlinkCollapsed')

            if (!this.hasOpenedMdFiles) {
                this.clear()
                return
            }

            if (isBacklinkView) {
                return
            }

            if (!isAllowedView) {
                this.clear()
                return
            }

            if (!this.isPluginLeafExists) {
                this.clear()
                this.createPluginLeaf()
            }

            const { prBacklinkLeaf, mdBacklinkLeaf } = this.data

            const mdLeafEl = mdBacklinkLeaf.view.containerEl.parentNode as HTMLElement
            const prLeafEl = prBacklinkLeaf.view.containerEl.parentNode as HTMLElement

            const mdEl = activeView.containerEl.querySelector('.mod-active .markdown-source-view .CodeMirror-lines')
            const prEl = activeView.containerEl.querySelector('.mod-active .markdown-preview-view')

            mdEl.appendChild(mdLeafEl)
            prEl.appendChild(prLeafEl)

            await this.updateBacklinks(file)
            // @ts-ignore
            await this.saveData({ ids: [mdBacklinkLeaf.id, prBacklinkLeaf.id] })
        })
    }

    onunload() {
        console.log('unloading plugin');
    }
}
