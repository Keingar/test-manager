import { FormEvent, useState } from 'react'
import './App.css'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CppConnector } from './components/CppConnector'
import { discoverTests, runTest } from './services/cppAdapter'
import { loadProjects, saveProjects } from './services/projectStorage'
import { Project } from './types/testManager'

function App() {
    const [projects, setProjects] = useState<Project[]>(loadProjects)
    const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id ?? '')
    const [selectedTestId, setSelectedTestId] = useState(projects[0]?.tests[0]?.id ?? '')
    const [isDiscovering, setIsDiscovering] = useState(false)
    const [runningTestId, setRunningTestId] = useState<string | null>(null)
    const [discoverError, setDiscoverError] = useState<string | null>(null)
    const [showProjectForm, setShowProjectForm] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [executablePath, setExecutablePath] = useState('')

    const activeProject = findProject(projects, activeProjectId)

    function updateProjects(nextProjects: Project[]) {
        setProjects(nextProjects)
        saveProjects(nextProjects)
    }

    function handleProjectChange(projectId: string) {
        const project = findProject(projects, projectId)
        setActiveProjectId(projectId)
        setSelectedTestId(project?.tests[0]?.id ?? '')
        setDiscoverError(null)
    }

    function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!projectName.trim() || !executablePath.trim()) return

        const newProject: Project = {
            id: `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            name: projectName.trim(),
            executablePath: executablePath.trim(),
            tests: [],
        }

        updateProjects([...projects, newProject])
        setActiveProjectId(newProject.id)
        setSelectedTestId('')
        setProjectName('')
        setExecutablePath('')
        setDiscoverError(null)
        setShowProjectForm(false)
    }

    async function handleDiscoverTests() {
        if (!activeProject || isDiscovering) return

        setIsDiscovering(true)
        setDiscoverError(null)

        try {
            const discovered = await discoverTests(activeProject.executablePath)
            const withPreservedRuns = discovered.map((test) => {
                const existing = activeProject.tests.find((previous) => previous.id === test.id)
                return existing ? { ...test, runs: existing.runs } : test
            })

            updateProjects(projects.map((project) => project.id === activeProject.id
                ? { ...project, tests: withPreservedRuns }
                : project))
            setSelectedTestId(withPreservedRuns[0]?.id ?? '')
        } catch (error) {
            setDiscoverError(error instanceof Error ? error.message : 'Failed to discover tests.')
        } finally {
            setIsDiscovering(false)
        }
    }

    async function handleRunTest(testId: string) {
        if (!activeProject || runningTestId) return

        const test = activeProject.tests.find((candidate) => candidate.id === testId)
        if (!test) return

        setRunningTestId(testId)

        try {
            const newRun = await runTest(activeProject.executablePath, test.name)

            updateProjects(projects.map((project) => {
                if (project.id !== activeProject.id) return project

                return {
                    ...project,
                    tests: project.tests.map((candidate) => candidate.id === testId
                        ? { ...candidate, runs: [newRun, ...candidate.runs] }
                        : candidate),
                }
            }))
        } finally {
            setRunningTestId(null)
        }
    }

    return (
        <div className="app-shell">
            <header className="minimal-header">
                <strong>Test Manager</strong>
                <div className="project-controls">
                    <label htmlFor="project-select">Project</label>
                    <select id="project-select" value={activeProject?.id ?? ''} onChange={(event) => handleProjectChange(event.target.value)}>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                    <button className="secondary-button" onClick={() => setShowProjectForm(true)}>New project</button>
                </div>
            </header>

            <main className="minimal-content">
                {activeProject ? (
                    <CppConnector
                        project={activeProject}
                        selectedTestId={selectedTestId}
                        isDiscovering={isDiscovering}
                        runningTestId={runningTestId}
                        discoverError={discoverError}
                        onDiscover={handleDiscoverTests}
                        onSelectTest={setSelectedTestId}
                        onRunTest={handleRunTest}
                    />
                ) : (
                    <p className="empty-history">Create a C++ project to get started.</p>
                )}
            </main>

            {showProjectForm && (
                <CreateProjectModal
                    projectName={projectName}
                    executablePath={executablePath}
                    onNameChange={setProjectName}
                    onExecutablePathChange={setExecutablePath}
                    onClose={() => setShowProjectForm(false)}
                    onSubmit={handleCreateProject}
                />
            )}
        </div>
    )
}

function findProject(projects: Project[], projectId: string) {
    return projects.find((project) => project.id === projectId) ?? projects[0]
}

export default App

