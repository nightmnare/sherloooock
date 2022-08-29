import React from "react"
import { useContract, useProvider } from "wagmi"

import { Box } from "../../components/Box"
import { Row, Column } from "../../components/Layout"
import Options from "../../components/Options/Options"
import TokenInput from "../../components/TokenInput/TokenInput"
import { Text } from "../../components/Text"
import config from "../../config"
import { TokenLockingWithNFTLimit } from "../../contracts"
import StakingABI from "../../abi/TokenLockingWithNFTLimit.json"
import useERC20 from "../../hooks/useERC20"
import useSherlock, { StakingTypeEnum } from "../../hooks/useSherlock"

import styles from "./Calculator.module.scss"
import { formatAmount } from "../../utils/format"
import { BigNumber } from "ethers"

export const CalculatorPage: React.FC = () => {
  const provider = useProvider()
  const { format: formatUSDC, decimals } = useERC20("USDC")
  const [amount, setAmount] = React.useState<string>()
  const [stakingType, setStakingType] = React.useState<StakingTypeEnum>(StakingTypeEnum.One)

  const { rewardFactor } = useSherlock()

  const [rewardFactorOne, setRewardFactorOne] = React.useState<number>(0)
  const [rewardFactorTwo, setRewardFactorTwo] = React.useState<number>(0)

  React.useEffect(() => {
    rewardFactor(StakingTypeEnum.One).then((value) => {
      setRewardFactorOne(value.div(BigNumber.from(10).pow(decimals - 3)).toNumber() / 1000)
    })
    rewardFactor(StakingTypeEnum.Two).then((value) => {
      setRewardFactorTwo(value.div(BigNumber.from(10).pow(decimals - 3)).toNumber() / 2000)
    })
  }, [rewardFactor, decimals])

  return (
    <Box>
      <Column spacing="m">
        <Row spacing="m">
          <Column grow={1} spacing="m">
            <TokenInput
              decimals={decimals}
              value={amount}
              setValue={setAmount}
              token="USDC"
              placeholder="Choose amount"
            ></TokenInput>
          </Column>
        </Row>
        <Row spacing="m">
          <Options
            value={stakingType}
            options={[
              { label: "15 days", value: StakingTypeEnum.One },
              { label: "30 days", value: StakingTypeEnum.Two },
            ]}
            onChange={(value: StakingTypeEnum) => setStakingType(value)}
          />
        </Row>
        <Row alignment="space-between">
          <Column>
            <Text>Estimated Rewards</Text>
          </Column>
          <Column>
            <Text strong variant="mono">
              {amount &&
                formatAmount(
                  Number(amount) * (stakingType === StakingTypeEnum.One ? rewardFactorOne : rewardFactorTwo)
                )}{" "}
              USDC
            </Text>
          </Column>
        </Row>
      </Column>
    </Box>
  )
}
