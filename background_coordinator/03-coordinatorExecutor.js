class BCoordinator_Executor
{
	theCurrentPlan = undefined

	constructor()
	{
		
	}

	/**
	 * Set the current executor's plan to the given plan, pending execution
	 * @param {BCoordinator_Plan} thePlan 
	 */
	setPlan(thePlan)
	{

	}

	/**
	 * Execute the steps currently in the queue. 
	 */
	async executeAsyncPlan()
	{
		let previousFunctionArguments = undefined

		for (let stepIterator = 0; stepIterator < this.containedSteps.length; stepIterator++)
		{
			theProposedStep = this.containedSteps[stepIterator]

			previousFunctionArguments = theProposedStep.executeStep(previousFunctionArguments)
			//TODO this step execution might result in a divergent execution, consider this scenario?
		}

		return previousFunctionArguments
	}

}