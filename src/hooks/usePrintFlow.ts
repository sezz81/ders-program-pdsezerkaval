import { useEffect, useState } from 'react'

import { AppStep, AutoPrintMode } from '../types'

interface UsePrintFlowArgs {
  step: AppStep
  setStep: (step: AppStep) => void
}

export function usePrintFlow({ step, setStep }: UsePrintFlowArgs) {
  const [autoPrintMode, setAutoPrintMode] = useState<AutoPrintMode | null>(null)

  useEffect(() => {
    if (
      !autoPrintMode
      || (autoPrintMode === AutoPrintMode.Program && step !== AppStep.Print)
      || (autoPrintMode === AutoPrintMode.Analysis && step !== AppStep.Analysis)
    ) {
      return
    }

    const handleAfterPrint = () => {
      if (autoPrintMode === AutoPrintMode.Program) {
        setStep(AppStep.Editor)
      }

      setAutoPrintMode(null)
    }

    const timeoutId = window.setTimeout(() => {
      window.print()
    }, autoPrintMode === AutoPrintMode.Program ? 320 : 220)

    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [autoPrintMode, setStep, step])

  return {
    queueProgramPrint: () => setAutoPrintMode(AutoPrintMode.Program),
    queueAnalysisPrint: () => setAutoPrintMode(AutoPrintMode.Analysis),
    openProgramPrintView: () => {
      setStep(AppStep.Print)
      setAutoPrintMode(AutoPrintMode.Program)
    },
  }
}
