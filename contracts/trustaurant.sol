// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Trustaurant {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Meal {
        string name;
        uint256 price; // in wei
        bool available;
    }

    struct Request {
        address client;
        uint mealId;
        bool approved;
        bool processed;
    }

    Meal[] public meals;
    Request[] public requests;

    mapping(address => uint256) public balances;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /// -----------------------------
    /// Admin Functions
    /// -----------------------------

    function addMeal(string memory _name, uint256 _price) public onlyOwner {
        meals.push(Meal(_name, _price, true));
    }

    function setMealAvailability(uint _mealId, bool _status) public onlyOwner {
        require(_mealId < meals.length, "Invalid meal ID");
        meals[_mealId].available = _status;
    }

function deleteMeal(uint _mealId) public onlyOwner {
    require(_mealId < meals.length, "Invalid meal ID");
    // Instead of just deleting, we'll set all fields to empty/default values
    meals[_mealId].name = "";
    meals[_mealId].price = 0;
    meals[_mealId].available = false;
}

    function viewAllRequests() public view onlyOwner returns (Request[] memory) {
        return requests;
    }

    function approveRequest(uint _requestId) public onlyOwner {
        Request storage req = requests[_requestId];
        require(!req.processed, "Already processed");
        Meal memory meal = meals[req.mealId];
        require(meal.available, "Meal not available");
        require(balances[req.client] >= meal.price, "Insufficient balance");

        balances[req.client] -= meal.price;
        balances[owner] += meal.price;

        req.approved = true;
        req.processed = true;
    }

    function denyRequest(uint _requestId) public onlyOwner {
        Request storage req = requests[_requestId];
        require(!req.processed, "Already processed");
        req.approved = false;
        req.processed = true;
    }

    /// -----------------------------
    /// Client Functions
    /// -----------------------------

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function viewMeals() public view returns (Meal[] memory) {
        return meals;
    }

    function requestMeal(uint _mealId) public {
        require(_mealId < meals.length, "Invalid meal ID");
        require(meals[_mealId].available, "Meal not available");

        requests.push(Request(msg.sender, _mealId, false, false));
    }

    function getMyBalance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function getMyRequests() public view returns (Request[] memory) {
        uint count;
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i].client == msg.sender) {
                count++;
            }
        }

        Request[] memory myRequests = new Request[](count);
        uint index = 0;
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i].client == msg.sender) {
                myRequests[index++] = requests[i];
            }
        }

        return myRequests;
    }

    function withdrawTo(uint256 _amount, address _recipient) public onlyOwner {
    require(_amount <= balances[owner], "Insufficient balance");
    require(_recipient != address(0), "Invalid recipient address");
    
    balances[owner] -= _amount;
    (bool success, ) = _recipient.call{value: _amount}("");
    require(success, "Transfer failed");
}
}
