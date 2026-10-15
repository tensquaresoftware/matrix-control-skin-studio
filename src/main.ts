import './model'
import './history'
import './persist'
import './io'
import './seed'
import './chrome'
import './canvas'
import './sidebar'
import './styles'
import { mountBootSurface } from './boot-surface'

mountBootSurface(document.querySelector<HTMLDivElement>('#app'))
