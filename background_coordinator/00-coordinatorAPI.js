import BCoordinator_Step from "./01-coordinatorStep.js";
import BCoordinator_Plan from "./02-coordinatorPlan.js";
import BCoordinator_Executor from "./03-coordinatorExecutor.js";

/*
 * This class should contain the API required to expose coordinator functionality to the world.
 */

class BCoordinator_API
{
	static theExecutor = undefined

	constructor()
	{
		this.constructor.theExecutor = new BCoordinator_Executor()
	}

	/**
	 * 
	 * @returns BCoordinator_Plan
	 */
	getEmptyPlan()
	{
		let planToReturn = new BCoordinator_Plan()
		return planToReturn
	}

	/**
	 * Execute a given plan and return it's reponse in an asynchronous manner
	 * @param {BCoordinator_Plan} thePlan 
	 * @param {Function} successCallback 
	 * @param {Function} failCallback 
	 */
	async submitPlan(thePlan,successCallback,failCallback = undefined)
	{
		//this.constructor.theExecutor.
	}

}

//Define exposed classes here

export default BCoordinator_API;

////
