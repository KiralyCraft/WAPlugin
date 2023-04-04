const BCoordinator_ExceptionCategory = 
{
	//Raised when an step target could not be identified
	ERR_STEP_IDENTIFICATION_FAILED: 0,
	//Raised when an object has been identified, but the provided action could not be executed upon it
	ERR_STEP_EXECUTION_FAILED: 1,
	//Raised when the step recipe for the executor is modified while it is running
	ERR_EXECUTOR_CONCURRENT_MODIFICATION: 2,

}

export default BCoordinator_ExceptionCategory