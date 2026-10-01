import { FormEvent } from 'react'

type CreateProjectModalProps = {
    projectName: string
    executablePath: string
    onNameChange: (name: string) => void
    onExecutablePathChange: (path: string) => void
    onClose: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateProjectModal({ projectName, executablePath, onNameChange, onExecutablePathChange, onClose, onSubmit }: CreateProjectModalProps) {
    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <form className="project-modal" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
                <div className="modal-heading">
                    <div><span className="eyebrow">C++ project</span><h2>Create a project</h2></div>
                    <button type="button" className="close-button" onClick={onClose}>x</button>
                </div>

                <label>
                    Project name
                    <input autoFocus value={projectName} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Math Library" />
                </label>
                <label>
                    Test executable path
                    <input value={executablePath} onChange={(event) => onExecutablePathChange(event.target.value)} placeholder="C:/Projects/my-project/build/tests.exe" />
                </label>

                <p className="modal-note">The path should point to a compiled GoogleTest executable. Test Manager will discover its tests through the C++ adapter.</p>
                <button className="primary-button modal-submit" type="submit">Create project <span>+</span></button>
            </form>
        </div>
    )
}
