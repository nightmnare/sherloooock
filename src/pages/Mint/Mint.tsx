import * as React from "react"
import { Box } from "../../components/Box"
import { Button } from "../../components/Button/Button"

import styles from "./Mint.module.scss"

const imageSrcs: Array<string> = []
const imageNumbers = Array.from({ length: 14 }, (_, i) => i + 1)
;(async () => {
  for (const number of imageNumbers) {
    const { default: path } = await import(`../../assets/images/nfts/${number}.png`)
    imageSrcs.push(path)
  }
})()

export const MintPage: React.FC = () => {
  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0)
  React.useEffect(() => {
    const timerRef = setInterval(() => {
      setActiveImageIndex((_prev) => {
        return _prev === imageNumbers.length - 1 ? 0 : _prev + 1
      })
    }, 500)
    return () => {
      clearInterval(timerRef)
    }
  }, [])
  return (
    <Box>
      <img className={styles.image} src={imageSrcs[activeImageIndex]} width={200} height={200} alt="nfts" />
      <Button>Mint</Button>
    </Box>
  )
}
