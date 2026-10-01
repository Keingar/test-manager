export type TestRunStatus = 'passed' | 'failed'

export type TestRun = {
    id: string
    startedAt: string
    duration: number
    status: TestRunStatus
    message: string
    expected?: string
    actual?: string
}

export type ManagedTest = {
    id: string
    /** Test name as reported by the C++ test executable, e.g. "Addition". */
    name: string
    runs: TestRun[]
}

export type Project = {
    id: string
    name: string
    /** Path to the compiled C++ test executable that implements the Test Manager CLI protocol. */
    executablePath: string
    tests: ManagedTest[]
}