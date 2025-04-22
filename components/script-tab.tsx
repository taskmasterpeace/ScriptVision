"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/stores/project-store"
import { Loader2, FileText, List, CheckCircle2, AlertTriangle } from "lucide-react"
import { useLoadingStore } from "@/lib/stores/loading-store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ScriptTab() {
  const { toast } = useToast()
  const { script, setScript, generateShotList, shotList } = useProjectStore()
  const { isLoading } = useLoadingStore()
  const [localScript, setLocalScript] = useState(script)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Update local script when the store changes
  useEffect(() => {
    setLocalScript(script)
  }, [script])

  // Show success message when shot list is generated
  useEffect(() => {
    if (shotList.length > 0) {
      setShowSuccess(true)
      setShowError(false)
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [shotList])

  const handleSaveScript = () => {
    setScript(localScript)
    toast({
      title: "Script Saved",
      description: "Your script has been saved.",
    })
  }

  const handleGenerateShotList = async () => {
    if (!localScript.trim()) {
      toast({
        title: "Script is Empty",
        description: "Please enter a script before generating a shot list.",
        variant: "destructive",
      })
      return
    }

    // Reset error state
    setShowError(false)
    setErrorMessage("")

    // Save the script first
    setScript(localScript)

    try {
      await generateShotList()
      toast({
        title: "Shot List Generated",
        description: "Your shot list has been generated successfully. You can now view it in the Shot List tab.",
      })
      setShowSuccess(true)
      // Hide the success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("Shot list generation error:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to generate shot list."
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      })
      setShowError(true)
      setErrorMessage(errorMsg)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ScriptVision</CardTitle>
        <CardDescription>Enter your script or screenplay to generate a shot list</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your script here..."
          className="min-h-[300px] font-mono text-sm"
          value={localScript}
          onChange={(e) => setLocalScript(e.target.value)}
        />

        {showSuccess && shotList.length > 0 && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Shot List Generated Successfully</AlertTitle>
            <AlertDescription>
              Your shot list has been generated and is ready to view in the Shot List tab.
            </AlertDescription>
          </Alert>
        )}

        {showError && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-600">Generation Failed</AlertTitle>
            <AlertDescription>
              {errorMessage || "There was an error generating the shot list. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row w-full gap-4">
          <Button onClick={handleSaveScript} className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            Save Script
          </Button>
          <Button
            onClick={handleGenerateShotList}
            className="w-full sm:w-auto"
            disabled={isLoading("generateShotList")}
          >
            {isLoading("generateShotList") ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Generate Shot List
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
