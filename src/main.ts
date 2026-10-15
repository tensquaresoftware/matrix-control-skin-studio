import './model'
import './history'
import './persist'
import './io'
import './seed'
import './chrome'
import './canvas'
import './sidebar'
import './styles'
import { bootProjectStore } from './boot-project'
import { mountBootSurface } from './boot-surface'
import { initProjectStore } from './model'

const projectStore = initProjectStore()
bootProjectStore(projectStore)
mountBootSurface(document.querySelector<HTMLDivElement>('#app'), projectStore)
