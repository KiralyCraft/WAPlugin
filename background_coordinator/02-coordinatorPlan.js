import BCoordinator_Step from './01-coordinatorStep.js'
import BCoordinator_ExceptionCategory from './00-coordinatorExceptionCodes.js'

class BCoordinator_Plan
{

	constructor()
	{
		this.totalSteps = 0
		this.currentStep = 0
		this.containedSteps = []
		this.isRunning = false
	}

	/**
	 * This function should receive a BCoordinator_Step and append it to the chain of execution.
	 * @param {*} theStep 
	 */
	addStep(theStep)
	{
		if (!this.isRunning)
		{
			this.containedSteps.push(theStep)
		}
		else
		{
			throw BCoordinator_ExceptionCategory.ERR_EXECUTOR_CONCURRENT_MODIFICATION
		}
	}

	/**
	 * Returns the number of steps currently memorised by the coordinator.
	 */
	getStepCount()
	{
		return this.containedSteps.length
	}
}

export default BCoordinator_Executor