import React from "react"

import { BigNumber, ethers } from "ethers"
import AllowanceGate from "../../components/AllowanceGate/AllowanceGate"
import { Box } from "../../components/Box"
import ConnectGate from "../../components/ConnectGate/ConnectGate"
import { Column, Row } from "../../components/Layout"
import LoadingContainer from "../../components/LoadingContainer/LoadingContainer"
import { Text } from "../../components/Text"
import { Title } from "../../components/Title"
import TokenInput from "../../components/TokenInput/TokenInput"
import useERC20, { AvailableERC20Tokens } from "../../hooks/useERC20"
import useSherlock, { StakingTypeEnum } from "../../hooks/useSherlock"
import useWaitTx from "../../hooks/useWaitTx"
import { formatAmount } from "../../utils/format"
import { TxType } from "../../utils/txModalMessages"
import styles from "./Staking.module.scss"
import Options from "../../components/Options/Options"
import { Button } from "../../components/Button/Button"

/**
 * Available staking periods, in seconds.
 *
 * TODO: Should be fetched automatically or hardcoded?
 */

export const StakingPage: React.FC<{ token: AvailableERC20Tokens }> = ({ token }) => {
  const [amount, setAmount] = React.useState<string>()
  const [isLoadingRewards] = React.useState(false)
  // const { getStakingPositions, data: stakePositionsData } = useStakingPositions()

  const { addressOne, addressTwo, stake, unstake, claimRewards, tokenStaked, rewardFactor } = useSherlock(token)
  const { format, balance: tokenBalance, decimals } = useERC20(token)
  const [rewardFactorOne, setRewardFactorOne] = React.useState<number>(0)
  const [rewardFactorTwo, setRewardFactorTwo] = React.useState<number>(0)

  const { waitForTx } = useWaitTx()

  const [stakingType, setStakingType] = React.useState<StakingTypeEnum>(StakingTypeEnum.One)

  const [timeleft, setTimeleft] = React.useState<number>(86400)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeleft((_prev) => {
        if (_prev < 2) clearInterval(interval)
        return _prev - 1
      })
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const sherRewards = React.useMemo(() => {
    if (!amount) return 0
    return Number(amount) * (stakingType === StakingTypeEnum.One ? rewardFactorOne : rewardFactorTwo)
  }, [amount, stakingType, rewardFactorOne, rewardFactorTwo])

  const uintSherRewards = React.useMemo(() => {
    return stakingType === StakingTypeEnum.One ? rewardFactorOne : rewardFactorTwo
  }, [stakingType, rewardFactorOne, rewardFactorTwo])

  const apy = React.useMemo(() => {
    return Math.round((stakingType === StakingTypeEnum.One ? rewardFactorOne * 24 : rewardFactorTwo * 12) * 100) / 100
  }, [stakingType, rewardFactorOne, rewardFactorTwo])

  const [stakedAmount, setStakedAmount] = React.useState<BigNumber>()

  React.useEffect(() => {
    tokenStaked(stakingType).then((res) => setStakedAmount(res))
  }, [tokenStaked, stakingType])

  React.useEffect(() => {
    rewardFactor(StakingTypeEnum.One).then((value) => {
      if (value) setRewardFactorOne(value.div(BigNumber.from(10).pow(decimals - 3)).toNumber() / 1000)
    })
    rewardFactor(StakingTypeEnum.Two).then((value) => {
      if (value) setRewardFactorTwo(value.div(BigNumber.from(10).pow(decimals - 3)).toNumber() / 1000)
    })
  }, [rewardFactor, decimals])

  /**
   * Stake token for a given period of time
   */
  const handleOnStake = React.useCallback(async () => {
    if (!amount || isNaN(Number(amount))) return

    const amountBigNum = BigNumber.from(Math.floor(Number(amount) * 100)).mul(BigNumber.from(10).pow(decimals - 2))
    await waitForTx(async () => (await stake(amountBigNum, stakingType)) as ethers.ContractTransaction, {
      transactionType: TxType.STAKE,
    })
  }, [amount, decimals, stakingType, stake, waitForTx])

  return (
    <div className={styles.container}>
      <Box fullWidth>
        <LoadingContainer loading={isLoadingRewards}>
          <Column spacing="m">
            <Title>Deposit</Title>
            <Row alignment="space-between">
              <Column>
                <Text>Total Value Locked</Text>
              </Column>
              <Column>
                <Text strong variant="mono">
                  {formatAmount(format(BigNumber.from("200921000000000000000000")))} {token}
                </Text>
              </Column>
            </Row>
            <Row alignment="space-between">
              <Column>
                <Text>{token} APY</Text>
              </Column>
              <Column>
                <Text strong variant="mono">
                  {apy} %
                </Text>
              </Column>
            </Row>
            <Row alignment="space-between">
              <Column>
                <Text>Reward per 1 {token}</Text>
              </Column>
              <Column>
                <Text strong variant="mono">
                  {formatAmount(uintSherRewards)} {token}
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
                    {formatAmount(format(stakedAmount))} {token}
                  </Text>
                </Column>
              </Row>
            )}
            <Row className={styles.rewardsContainer}>
              <Column grow={1} spacing="l">
                <Options
                  value={stakingType}
                  options={[
                    { label: "15 days", value: StakingTypeEnum.One },
                    { label: "30 days", value: StakingTypeEnum.Two },
                  ]}
                  onChange={(value: StakingTypeEnum) => setStakingType(value)}
                />
                <TokenInput
                  decimals={decimals}
                  value={amount}
                  setValue={setAmount}
                  token={token}
                  placeholder="Choose amount"
                  balance={tokenBalance}
                />
                {sherRewards > 0 && (
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
                          {formatAmount(sherRewards)} {token}
                        </Text>
                      </Column>
                    </Row>
                  </>
                )}
                <ConnectGate>
                  {amount && Number(amount) > 0 && sherRewards && (
                    <Row alignment="center">
                      <AllowanceGate
                        amount={BigNumber.from(Math.floor(Number(amount) * 100)).mul(
                          BigNumber.from(10).pow(decimals - 2)
                        )}
                        spender={stakingType === StakingTypeEnum.One ? addressOne : addressTwo}
                        actionName="Stake"
                        action={handleOnStake}
                        onSuccess={() => setAmount("")}
                      ></AllowanceGate>
                    </Row>
                  )}

                  <Row alignment="space-around">
                    <Column>
                      <Button
                        onClick={(event) => {
                          event.preventDefault()
                          if (stakedAmount)
                            waitForTx(async () => (await unstake(stakingType)) as ethers.ContractTransaction, {
                              transactionType: TxType.UNSTAKE,
                            })
                        }}
                        disabled={!stakedAmount || stakedAmount.lte(0)}
                      >
                        Unstake
                      </Button>
                    </Column>
                    <Column>
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
                    </Column>
                  </Row>
                  <Row alignment={["center", "end"]}>
                    <Text className={styles["seven-seg"]}>{Math.floor((Math.floor(timeleft / 86400) % 60) / 10)}</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor(timeleft / 86400) % 10}</Text>
                    <Text>D</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor((Math.floor(timeleft / 3600) % 60) / 10)}</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor(timeleft / 3600) % 10}</Text>
                    <Text>H</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor((Math.floor(timeleft / 60) % 60) / 10)}</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor(timeleft / 60) % 10}</Text>
                    <Text>M</Text>
                    <Text className={styles["seven-seg"]}>{Math.floor((timeleft % 60) / 10)}</Text>
                    <Text className={styles["seven-seg"]}>{timeleft % 10}</Text>
                    <Text>S</Text>
                  </Row>
                </ConnectGate>
              </Column>
            </Row>
          </Column>
        </LoadingContainer>
      </Box>
    </div>
  )
}
