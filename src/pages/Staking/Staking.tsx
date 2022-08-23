import { BigNumber, ethers } from "ethers"
import React from "react"
import { useDebounce } from "use-debounce"
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
import useSherDistManager from "../../hooks/useSherDistManager"
import useSherlock from "../../hooks/useSherlock"
import useWaitTx from "../../hooks/useWaitTx"
import { formatAmount } from "../../utils/format"
import { TxType } from "../../utils/txModalMessages"
import styles from "./Staking.module.scss"
import { useNavigate } from "react-router-dom"
import Options from "../../components/Options/Options"

/**
 * Available staking periods, in seconds.
 *
 * TODO: Should be fetched automatically or hardcoded?
 */

export const StakingPage: React.FC = () => {
  const [amount, setAmount] = React.useState<BigNumber>()
  const [debouncedAmountBN] = useDebounce(amount, 500, {
    equalityFn: (l, r) => (r ? !!l?.eq(r) : l === undefined),
  })
  const [sherRewards, setSherRewards] = React.useState<BigNumber>()
  const [isLoadingRewards, setIsLoadingRewards] = React.useState(false)
  const { getStakingPositions, data: stakePositionsData } = useStakingPositions()

  const { tvl, address, refreshTvl } = useSherlock()
  const { computeRewards } = useSherDistManager()
  const { format: formatSHER } = useERC20("SHER")
  const { format: formatUSDC, balance: usdcBalance } = useERC20("USDC")
  const { waitForTx } = useWaitTx()
  const accountData = useAccount()
  const navigate = useNavigate()

  /**
   * Compute staking rewards for current amount and staking period
   */
  const handleComputeRewards = React.useCallback(async () => {
    if (!tvl) return

    if (!debouncedAmountBN) {
      setSherRewards(undefined)
      return
    }
    setSherRewards(debouncedAmountBN.mul(BigNumber.from(10).pow(10)))
  }, [debouncedAmountBN, tvl])

  /**
   * Stake USDC for a given period of time
   */
  const handleOnStake = React.useCallback(async () => {
    if (!amount) return

    // const result = await waitForTx(async () => (await stake(amount, stakingPeriod)) as ethers.ContractTransaction, {
    //   transactionType: TxType.STAKE,
    // })

    // Navigate to positions page
    // navigate("/positions", { state: { refreshAfterBlockNumber: result.blockNumber } })
  }, [amount])

  // Compute rewards when amount or period is changed
  React.useEffect(() => {
    handleComputeRewards()
  }, [debouncedAmountBN, handleComputeRewards])

  /**
   * Fetch USDC APY
   */
  React.useEffect(() => {
    getStakingPositions(accountData?.address ?? undefined)
  }, [getStakingPositions, accountData?.address])

  return (
    <Box>
      <LoadingContainer loading={isLoadingRewards}>
        <Column spacing="m">
          <Title>Deposit</Title>
          <Row alignment="space-between">
            <Column>
              <Text>Total Value Locked</Text>
            </Column>
            <Column>
              {tvl && (
                <Text strong variant="mono">
                  ${formatAmount(formatUSDC(tvl))}
                </Text>
              )}
            </Column>
          </Row>
          {stakePositionsData && (
            <Row alignment="space-between">
              <Column>
                <Text>USDC APY</Text>
              </Column>
              <Column>
                <Text strong variant="mono">
                  {formatAmount(stakePositionsData?.usdcAPY)}%
                </Text>
              </Column>
            </Row>
          )}
          <Row className={styles.rewardsContainer}>
            <Column grow={1} spacing="l">
              <TokenInput
                value={debouncedAmountBN}
                onChange={setAmount}
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
                        {formatAmount(formatSHER(sherRewards))} SHER
                      </Text>
                    </Column>
                  </Row>
                  {stakePositionsData && (
                    <Row alignment="space-between">
                      <Column>
                        <Text>USDC APY</Text>
                      </Column>
                      <Column>
                        <Text strong variant="mono">
                          {formatAmount(stakePositionsData?.usdcAPY)}%
                        </Text>
                      </Column>
                    </Row>
                  )}
                </>
              )}

              {amount && sherRewards && (
                <Row alignment="center">
                  <ConnectGate>
                    <AllowanceGate
                      amount={amount}
                      spender={address}
                      actionName="Claim"
                      action={handleOnStake}
                      onSuccess={refreshTvl}
                    ></AllowanceGate>
                  </ConnectGate>
                </Row>
              )}
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
