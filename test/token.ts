import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { Token, Token__factory } from '../generated';

describe('Token', function () {
  let token: Token;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    const Token = (await ethers.getContractFactory('Token')) as Token__factory;
    token = await Token.deploy('Token', 'TOK');
    await token.deployed();

    [owner, user1, user2] = await ethers.getSigners();
  });

  it('Should mint tokens to user1', async function () {
    await token.mint(user1.address, '100');
    expect(await token.balanceOf(user1.address)).to.equal('100');
    expect(await token.totalSupply()).to.equal('100');
  });

  it('Should transfer tokens from user1 to user2', async function () {
    await token.mint(user1.address, '100');
    expect(await token.balanceOf(user1.address)).to.equal('100');

    await token.connect(user1).transfer(user2.address, '50');
    expect(await token.balanceOf(user1.address)).to.equal('50');
    expect(await token.balanceOf(user2.address)).to.equal('50');
  });

  it('Should burn tokens when received', async function () {
    await token.mint(user1.address, '100');
    const tx = await token.connect(user1).transfer(owner.address, '50');

    expect(tx)
      .to.emit(token, 'Transfer')
      .withArgs(user1.address, owner.address, '50');
    expect(await token.balanceOf(user1.address)).to.equal('50');
    expect(await token.balanceOf(owner.address)).to.equal('50');

    await token.connect(owner).burn('50');
    expect(await token.balanceOf(owner.address)).to.equal('0');
    expect(await token.totalSupply()).to.equal('50');
  });
});
