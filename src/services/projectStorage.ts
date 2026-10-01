import { Project } from '../types/testManager'

const storageKey = 'test-manager-projects-v2'

export function loadProjects(): Project[] {
    const savedProjects = localStorage.getItem(storageKey)

    if (!savedProjects) {
        return []
    }

    try {
        return JSON.parse(savedProjects) as Project[]
    } catch {
        return []
    }
}

export function saveProjects(projects: Project[]) {
    localStorage.setItem(storageKey, JSON.stringify(projects))
}