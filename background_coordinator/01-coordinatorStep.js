import BCoordinator_ExceptionCategory from './00-coordinatorExceptionCodes.js'

/*
 * This class defines a step in the navigation procedure. Any step should be able to receive parameters and return some as a result of it's execution.
 * Should the step fail, a specially defined callback MUST be called.
 * Callbacks for successful operations are optional.
 */

class BCoordinator_Step
{
	/*
	 *	This constructor behaves differently based on what the "actionIdentifier" is.
	 *	The actionIdentifier must be a function that returns an object. If it is a function, it is evaluated
	 *  at the time of execution with the currently received parameters from the previous step. 
	 */
	constructor(actionIdentifier,stepExecutionFunction)
	{
		this.actionIdentifier = actionIdentifier
		this.stepExecutionFunction = stepExecutionFunction
	}

	async executeStep(previousStepArguments,successCallback,failCallback)
	{
		let theIdentifiedObject = actionIdentifier()

		if (theIdentifiedObject === undefined)
		{
			//TODO also throw an error here
			failCallback(this,BCoordinator_ExceptionCategory.ERR_STEP_IDENTIFICATION_FAILED)
		}
		else
		{
			try
			{
				let functionExecutionResult = stepExecutionFunction(theIdentifiedObject,previousStepArguments)
				successCallback(this)
				return functionExecutionResult
			}
			catch(theRaisedError)
			{
				failCallback(this,BCoordinator_ExceptionCategory.ERR_STEP_EXECUTION_FAILED)
				throw theRaisedError
			}
		}
	}
	
}

export default BCoordinator_Step