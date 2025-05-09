async function main() {
  // Get the contract factory
  const Trustaurant = await ethers.getContractFactory("Trustaurant");
  
  // Deploy the contract
  const trustaurant = await Trustaurant.deploy();
  // Remove the .deployed() call and wait for the deployment transaction
  await trustaurant.waitForDeployment();

  console.log("Trustaurant deployed to:", await trustaurant.getAddress());
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });