const getObjectRecursive = async (type, id)=>{     //'type' will be 'Foo' or 'Bar'
    const rslt = await type.findOne.call(type, {_id:id},{}, {}, err=>{
        if(err){
            return({err: err});
        }
    });

    const result = rslt.toObject();
    const bars = result.bars;
    const bazs = result.bazs;
    result.children = {};
    result.children.bars = tasks.map(async barId=>{
        const barIdString = barId.toString();
        await getBarRecursive(barIdString, err=>{
            if(err){
                reject(err);
            }
        });
    });
    result.children.bazs = bazs.map(async eventId=>{
        const bazIdString = bazId.toString();
        await Baz.findOne({_id:eventIdString}, {},err=>{
            if(err){
                reject(err);
            }
        });
    });
};
