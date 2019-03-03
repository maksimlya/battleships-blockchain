const Battleships = artifacts.require("./Battleships.sol");

contract("Battleships", accounts => {
  it("should store the string 'Hey there!'", async () => {
    const battleships = await Battleships.deployed();

    // Set myString to "Hey there!"
    await battleships.set("Hey there!", { from: accounts[0] });

    // Get myString from public variable getter
    const storedString = await battleships.myString.call();

    assert.equal(storedString, "Hey there!", "The string was not stored");
  });
}); 
