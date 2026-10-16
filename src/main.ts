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
import { mountChromeShell } from './chrome'
import { initProjectStore } from './model'

const projectStore = initProjectStore()
bootProjectStore(projectStore)
mountChromeShell(document.querySelector<HTMLDivElement>('#app'), projectStore)
