import { Config } from "./ConfigType"

export const config: Config = {
  networkId: parseInt(process.env.REACT_APP_NETWORK_ID as string),
  usdcAddress: process.env.REACT_APP_USDC_ADDRESS as string,
  stakingOneAddress: process.env.REACT_APP_STAKING_ONE_ADDRESS as string,
  stakingTwoAddress: process.env.REACT_APP_STAKING_TWO_ADDRESS as string,
}
