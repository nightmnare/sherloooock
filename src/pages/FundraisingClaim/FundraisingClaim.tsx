import { BigNumber, ethers } from "ethers"
import React, { useCallback, useEffect, useState } from "react"
import { useAccount } from "wagmi"

import { useSherClaimContract } from "../../hooks/useSherClaimContract"

export const FundraisingClaimPage = () => {
  const [{ data: accountData }] = useAccount()
  const sherClaim = useSherClaimContract()

  /**
   * Amount of SHER tokens available to be claimed once the fundraise event ends.
   */
  const [claimableAmount, setClaimableAmount] = useState<BigNumber>()

  /**
   * Wheter the claim is active or not.
   */
  const [claimIsActive, setClaimIsActive] = useState(false)

  /**
   * Refresh claimable amount from smart contract
   */
  const refreshClaimableAmount = useCallback(async () => {
    if (!accountData?.address) return

    try {
      const sherAmount = await sherClaim.getClaimableAmount(accountData?.address)
      setClaimableAmount(sherAmount)
    } catch (error) {
      console.error(error)
      setClaimableAmount(undefined)
    }
  }, [sherClaim, setClaimableAmount, accountData?.address])

  /**
   * Fetch user's claimable amount
   */
  useEffect(() => {
    refreshClaimableAmount()
  }, [refreshClaimableAmount])

  /**
   * Fetch claim is active or not
   */
  useEffect(() => {
    const fetchClaimIsActive = async () => {
      try {
        const isActive = await sherClaim.claimIsActive()
        setClaimIsActive(isActive)
      } catch (error) {
        console.error(error)
        setClaimIsActive(false)
      }
    }

    fetchClaimIsActive()
  })

  const handleClaim = useCallback(() => {
    const claim = async () => {
      try {
        const txReceipt = await sherClaim.claim()
        console.log(txReceipt)
        await refreshClaimableAmount()
      } catch (error) {
        console.log(error)
      }
    }

    claim()
  }, [sherClaim, refreshClaimableAmount])

  const sherAmount = claimableAmount && ethers.utils.formatUnits(claimableAmount)

  return (
    <div>
      <h1>CLAIM</h1>
      {sherAmount && <h2>Available for claim: {sherAmount} SHER</h2>}
      <button onClick={handleClaim} disabled={!claimIsActive}>
        {claimIsActive ? `Claim ${sherAmount} SHER` : "Claim is not active yet"}
      </button>
    </div>
  )
}
