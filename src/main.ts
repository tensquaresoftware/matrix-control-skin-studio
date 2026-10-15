import './model'
import './history'
import './io'
import './seed'
import './chrome'
import './canvas'
import './sidebar'
import './styles'
import { mountBootSurface } from './boot-surface'
import { initProjectStore } from './model'
import { attachAutosave, restoreEnvelope } from './persist'

const projectStore = initProjectStore()
restoreEnvelope(projectStore)
attachAutosave(projectStore)
mountBootSurface(document.querySelector<HTMLDivElement>('#app'))
