import * as React from "react"
import { Button } from "../../components/Button/Button"
import { Column } from "../../components/Layout"
import NFTImg from "../../assets/images/nfts/key.gif"

import styles from "./Mint.module.scss"

export const MintPage: React.FC = () => {
  return (
    <Column>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={NFTImg} alt="NFTImg" />
      </div>
      <Button>Mint</Button>
    </Column>
  )
}
