import MenuItem from "./menu/MenuItem"
import { MENU_STYLE } from "./style"

const Menu = () => {

  const items = ["nhex", "view", "server", "settings", "window", "help"]

  return (
    <div className={MENU_STYLE}>
      {items.map((item, i) => <MenuItem key={i}>{item}</MenuItem>)}
    </div>
  )
}

export default Menu
