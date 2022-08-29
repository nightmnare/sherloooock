import { BigNumber, ethers } from "ethers"
import React from "react"
import { useDebounce, useDebouncedCallback, useThrottledCallback } from "use-debounce"
import { useAccount } from "wagmi"
import AllowanceGate from "../../components/AllowanceGate/AllowanceGate"
import { Box } from "../../components/Box"
import ConnectGate from "../../components/ConnectGate/ConnectGate"
import { Column, Row } from "../../components/Layout"
import LoadingContainer from "../../components/LoadingContainer/LoadingContainer"
import { Text } from "../../components/Text"
import { Title } from "../../components/Title"
import TokenInput from "../../components/TokenInput/TokenInput"
import { useStakingPositions } from "../../hooks/api/useStakingPositions"
import useERC20 from "../../hooks/useERC20"
import useSherlock, { StakingTypeEnum } from "../../hooks/useSherlock"
import useWaitTx from "../../hooks/useWaitTx"
import { formatAmount } from "../../utils/format"
import { TxType } from "../../utils/txModalMessages"
import styles from "./Staking.module.scss"
import { useNavigate } from "react-router-dom"
import Options from "../../components/Options/Options"
import { TokenLockingWithNFTLimit } from "../../contracts"
import { Button } from "../../components/Button/Button"

/**
 * Available staking periods, in seconds.
 *
 * TODO: Should be fetched automatically or hardcoded?
 */

export const StakingPage: React.FC = () => {
  const [amount, setAmount] = React.useState<string>()
  const [isLoadingRewards, setIsLoadingRewards] = React.useState(false)
  // const { getStakingPositions, data: stakePositionsData } = useStakingPositions()

  const { addressOne, addressTwo, stake, unstake, claimRewards, rewardFactor, tokenStaked } = useSherlock()
  const { format: formatUSDC, balance: usdcBalance, decimals } = useERC20("USDC")
  const { waitForTx } = useWaitTx()
  const accountData = useAccount()
  const navigate = useNavigate()

  const [stakingType, setStakingType] = React.useState<StakingTypeEnum>(StakingTypeEnum.One)
  const [rewardFactorOne, setRewardFactorOne] = React.useState<BigNumber>()
  const [rewardFactorTwo, setRewardFactorTwo] = React.useState<BigNumber>()

  React.useEffect(() => {
    rewardFactor(StakingTypeEnum.One).then((value) => setRewardFactorOne(value))
    rewardFactor(StakingTypeEnum.Two).then((value) => setRewardFactorTwo(value))
  }, [rewardFactor])

  const sherRewards = BigNumber.from(10)

  // const sherRewards = React.useMemo(() => {
  //   if (amount && stakingType === StakingTypeEnum.One && rewardFactorOne)
  //     return BigNumber.from(amount).mul(rewardFactorOne)
  //   else if (amount && stakingType === StakingTypeEnum.Two && rewardFactorTwo)
  //     return BigNumber.from(amount).mul(rewardFactorTwo)
  //   else return undefined
  // }, [stakingType, rewardFactorOne, rewardFactorTwo, amount])

  const [stakedAmount, setStakedAmount] = React.useState<BigNumber>()

  React.useEffect(() => {
    tokenStaked(stakingType).then((res) => setStakedAmount(res))
  }, [tokenStaked, stakingType])

  /**
   * Stake USDC for a given period of time
   */
  const handleOnStake = React.useCallback(async () => {
    if (!amount || isNaN(Number(amount))) return

    const amountBigNum = BigNumber.from(Math.floor(Number(amount) * 100)).mul(BigNumber.from(10).pow(decimals - 2))
    await waitForTx(async () => (await stake(amountBigNum, stakingType)) as ethers.ContractTransaction, {
      transactionType: TxType.STAKE,
    })
  }, [amount, decimals, stakingType, stake, waitForTx])

  return (
    <Box>
      <LoadingContainer loading={isLoadingRewards}>
        <Column spacing="m">
          <Title>Deposit</Title>
          <Options
            value={stakingType}
            options={[
              { label: "15 days", value: StakingTypeEnum.One },
              { label: "30 days", value: StakingTypeEnum.Two },
            ]}
            onChange={(value: StakingTypeEnum) => setStakingType(value)}
          />
          <Row alignment="space-between">
            <Column>
              <Text>Total Value Locked</Text>
            </Column>
            <Column>
              <Text strong variant="mono">
                {formatAmount(formatUSDC(BigNumber.from(0)))} USDC
              </Text>
            </Column>
          </Row>
          {stakedAmount && (
            <Row alignment="space-between">
              <Column>
                <Text>Staked Amount</Text>
              </Column>
              <Column>
                <Text strong variant="mono">
                  {formatAmount(formatUSDC(stakedAmount))} USDC
                </Text>
              </Column>
            </Row>
          )}

          <Row className={styles.rewardsContainer}>
            <Column grow={1} spacing="l">
              <TokenInput
                decimals={decimals}
                value={amount}
                setValue={setAmount}
                token="USDC"
                placeholder="Choose amount"
                balance={usdcBalance}
              />
              {sherRewards && (
                <>
                  <Row>
                    <hr />
                  </Row>
                  <Row alignment="space-between">
                    <Column>
                      <Text>SHER Reward</Text>
                    </Column>
                    <Column>
                      <Text strong variant="mono">
                        {formatAmount(formatUSDC(sherRewards))} USDC
                      </Text>
                    </Column>
                  </Row>
                  {
                    <Row alignment="space-between">
                      <Column>
                        <Text>USDC APY</Text>
                      </Column>
                      <Column>
                        <Text strong variant="mono">
                          {formatAmount(1)}%
                        </Text>
                      </Column>
                    </Row>
                  }
                </>
              )}

              {amount && Number(amount) > 0 && sherRewards && (
                <Row alignment="center">
                  <ConnectGate>
                    <AllowanceGate
                      amount={BigNumber.from(Math.floor(Number(amount) * 100)).mul(
                        BigNumber.from(10).pow(decimals - 2)
                      )}
                      spender={stakingType === StakingTypeEnum.One ? addressOne : addressTwo}
                      actionName="Stake"
                      action={handleOnStake}
                      onSuccess={() => setAmount("")}
                    ></AllowanceGate>
                  </ConnectGate>
                </Row>
              )}
              <Row alignment="center">
                <ConnectGate>
                  <Button
                    onClick={(event) => {
                      event.preventDefault()
                      if (stakedAmount)
                        waitForTx(
                          async () => (await unstake(stakedAmount, stakingType)) as ethers.ContractTransaction,
                          {
                            transactionType: TxType.UNSTAKE,
                          }
                        )
                    }}
                    disabled={!stakedAmount || stakedAmount.lte(0)}
                  >
                    Unstake
                  </Button>
                  <Button
                    onClick={(event) => {
                      event.preventDefault()
                      if (stakedAmount)
                        waitForTx(async () => (await claimRewards(stakingType)) as ethers.ContractTransaction, {
                          transactionType: TxType.CLAIM_REWARDS,
                        })
                    }}
                    disabled={!stakedAmount || stakedAmount.lte(0)}
                  >
                    Claim Rewards
                  </Button>
                </ConnectGate>
              </Row>
            </Column>
          </Row>
          <Text size="small" className={styles.v1}>
            For the Sherlock V1, please see{" "}
            <a href="https://v1.sherlock.xyz" rel="noreferrer" target="_blank">
              https://v1.sherlock.xyz
            </a>
          </Text>
        </Column>
      </LoadingContainer>
    </Box>
  )
}
