export type Config = {
  /**
   * Running network ID
   */
  networkId: number

  /**
   * USDC Token Address
   *
   * See: https://docs.openzeppelin.com/contracts/2.x/api/token/erc20
   */
  usdcAddress: string
  stakingOneAddress: string
  stakingTwoAddress: string
}
