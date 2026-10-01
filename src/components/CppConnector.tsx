import { ManagedTest, Project, TestRun } from '../types/testManager'
import { formatDate } from '../utils/formatDate'

type CppConnectorProps = {
    project: Project | undefined
    selectedTestId: string
    isDiscovering: boolean
    runningTestId: string | null
    discoverError: string | null
    onDiscover: () => void
    onSelectTest: (testId: string) => void
    onRunTest: (testId: string) => void
}

export function CppConnector({ project, selectedTestId, isDiscovering, runningTestId, discoverError, onDiscover, onSelectTest, onRunTest }: CppConnectorProps) {
    const tests = project?.tests ?? []
    const selectedTest = tests.find((test) => test.id === selectedTestId)
    const runs = selectedTest?.runs ?? []
    const latestRun = runs[0]

    return (
        <div className="connector-page">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">C++ adapter</span>
                    <h1>{project?.name ?? 'No project selected'}</h1>
                    <p>{project?.executablePath}</p>
                </div>
                <button className="primary-button" onClick={onDiscover} disabled={!project || isDiscovering}>
                    {isDiscovering ? 'Discovering...' : 'Discover tests'}
                </button>
            </div>

            {discoverError && <p className="discover-error">{discoverError}</p>}

            <section className="connector-card test-card">
                <div className="card-heading">
                    <div>
                        <span className="card-label">Tests</span>
                        <h2>{tests.length ? `${tests.length} discovered` : 'None discovered yet'}</h2>
                    </div>
                </div>
                {tests.length ? (
                    <div className="test-rows">
                        {tests.map((test) => (
                            <TestRow
                                key={test.id}
                                test={test}
                                isSelected={test.id === selectedTestId}
                                isRunning={runningTestId === test.id}
                                onSelect={() => onSelectTest(test.id)}
                                onRun={() => onRunTest(test.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="empty-history">Click "Discover tests" to connect to the C++ test executable.</p>
                )}
            </section>

            {selectedTest && (
                <section className="connector-card">
                    <div className="card-heading">
                        <div>
                            <span className="card-label">Selected test</span>
                            <h2>{selectedTest.name}</h2>
                        </div>
                        {latestRun && <span className={`run-status ${latestRun.status}`}>{latestRun.status === 'passed' ? 'PASS' : 'FAIL'}</span>}
                    </div>

                    {latestRun ? (
                        <div className="run-detail">
                            <p>Duration: {latestRun.duration}s</p>
                            {latestRun.status === 'failed' && latestRun.expected && latestRun.actual ? (
                                <div className="failure-detail">
                                    <div><span>Expected</span><code>{latestRun.expected}</code></div>
                                    <div><span>Actual</span><code>{latestRun.actual}</code></div>
                                </div>
                            ) : (
                                <p className="run-message-block">{latestRun.message}</p>
                            )}
                        </div>
                    ) : (
                        <p className="empty-history">Not run yet.</p>
                    )}

                    <div className="history-section">
                        <div className="history-title"><h2>Run history</h2><span>{runs.length} {runs.length === 1 ? 'run' : 'runs'}</span></div>
                        {runs.length ? runs.slice(0, 5).map((run) => <RunItem key={run.id} run={run} />) : <p className="empty-history">No runs yet.</p>}
                    </div>
                </section>
            )}
        </div>
    )
}

type TestRowProps = {
    test: ManagedTest
    isSelected: boolean
    isRunning: boolean
    onSelect: () => void
    onRun: () => void
}

function TestRow({ test, isSelected, isRunning, onSelect, onRun }: TestRowProps) {
    const status = test.runs[0]?.status

    return (
        <div className={`test-row-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
            <span className={`run-status ${status ?? 'untested'}`}>{status === 'passed' ? 'PASS' : status === 'failed' ? 'FAIL' : '--'}</span>
            <span className="test-row-name">{test.name}</span>
            <button
                className="secondary-button"
                onClick={(event) => { event.stopPropagation(); onRun() }}
                disabled={isRunning}
            >
                {isRunning ? 'Running...' : 'Run'}
            </button>
        </div>
    )
}

function RunItem({ run }: { run: TestRun }) {
    return (
        <div className="minimal-run">
            <span className={`run-status ${run.status}`}>{run.status === 'passed' ? 'PASS' : 'FAIL'}</span>
            <span>{formatDate(run.startedAt)}</span>
            <span>{run.duration}s</span>
            <span className="run-message">{run.message}</span>
        </div>
    )
}
