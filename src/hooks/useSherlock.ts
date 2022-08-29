import React from "react"
import { useAccount, useContract, useProvider, useSigner } from "wagmi"
import { TokenLockingWithNFTLimit } from "../contracts"
import StakingABI from "../abi/TokenLockingWithNFTLimit.json"
import { BigNumber } from "ethers"
import config from "../config"

/**
 * React Hook for interacting with Sherlock contract.
 *
 * See https://github.com/sherlock-protocol/sherlock-v2-core
 */
export enum StakingTypeEnum {
  "One",
  "Two",
}
const useSherlock = () => {
  const provider = useProvider()
  const { data: signerData } = useSigner()
  const accountData = useAccount()
  const contractOne = useContract<TokenLockingWithNFTLimit>({
    addressOrName: config.stakingOneAddress,
    signerOrProvider: signerData || provider,
    contractInterface: StakingABI.abi,
  })
  const contractTwo = useContract<TokenLockingWithNFTLimit>({
    addressOrName: config.stakingTwoAddress,
    signerOrProvider: signerData || provider,
    contractInterface: StakingABI.abi,
  })

  /**
   * Stake USDC
   *
   * @param amount Amount of USDC staked
   * @param period Lock time
   */
  const stake = React.useCallback(
    async (amount: BigNumber, type: StakingTypeEnum) => {
      if (!accountData?.address) return
      if (type === StakingTypeEnum.One) return contractOne.Stake(amount)
      else return contractTwo.Stake(amount)
    },
    [accountData?.address, contractOne, contractTwo]
  )

  /**
   * Unsttake and cash out an unlocked position
   */
  const unstake = React.useCallback(
    async (amount: BigNumber, type: StakingTypeEnum) => {
      if (!accountData?.address) return
      if (type === StakingTypeEnum.One) return contractOne.Unstake(amount)
      else return contractTwo.Unstake(amount)
    },
    [accountData?.address, contractOne, contractTwo]
  )

  const claimRewards = React.useCallback(
    async (type: StakingTypeEnum) => {
      if (!accountData?.address) return
      if (type === StakingTypeEnum.One) return contractOne.claimRewards()
      else return contractTwo.claimRewards()
    },
    [accountData?.address, contractOne, contractTwo]
  )

  const checkRewards = React.useCallback(
    async (type: StakingTypeEnum) => {
      if (!accountData?.address) return
      if (type === StakingTypeEnum.One) return contractOne.CheckRewards(accountData?.address)
      else return contractTwo.CheckRewards(accountData?.address)
    },
    [accountData?.address, contractOne, contractTwo]
  )

  const tokenStaked = React.useCallback(
    async (type: StakingTypeEnum) => {
      if (!accountData?.address) return
      if (type === StakingTypeEnum.One) return contractOne.TokensStaked(accountData?.address)
      else return contractTwo.TokensStaked(accountData?.address)
    },
    [accountData?.address, contractOne, contractTwo]
  )

  const rewardFactor = React.useCallback(
    async (type: StakingTypeEnum) => {
      if (type === StakingTypeEnum.One) return contractOne.RewardFactor()
      else return contractTwo.RewardFactor()
    },
    [contractOne, contractTwo]
  )

  return React.useMemo(
    () => ({
      addressOne: config.stakingOneAddress,
      addressTwo: config.stakingTwoAddress,
      stake,
      unstake,
      claimRewards,
      checkRewards,
      tokenStaked,
      rewardFactor,
    }),
    [stake, unstake, claimRewards, checkRewards, tokenStaked, rewardFactor]
  )
}
export default useSherlock
