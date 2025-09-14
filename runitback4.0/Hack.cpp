#include <iostream>
#include <cstdlib>
#include <ctime>

void rng(); //random number generator

using namespace std;

int main (){

    cout << "Hello World";
    

    return 0;
}


void rng(int num){

    int const MAX_NUM = 1000;
    int const MIN_NUM = 1;


    int seed = time(0);
    srand(seed);
    num = (rand()%(MAX_NUM - MIN_NUM +1)) + MIN_NUM;

}