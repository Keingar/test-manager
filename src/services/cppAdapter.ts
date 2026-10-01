import { ManagedTest, TestRun } from '../types/testManager'

export async function discoverTests(executablePath: string): Promise<ManagedTest[]> {
    const testNames = await window.testManager.discoverCppTests(executablePath)

    return testNames.map((name) => ({
        id: name,
        name,
        runs: [],
    }))
}

export async function runTest(executablePath: string, testName: string): Promise<TestRun> {
    const result = await window.testManager.runCppTest(executablePath, testName)

    return {
        id: `run-${Date.now()}`,
        ...result,
    }
}
